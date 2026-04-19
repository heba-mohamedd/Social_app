import { NextFunction, Request, Response } from "express";
import { ISignUpType } from "./auth.dto";
import { IUser } from "../../DB/models/user.model";
import UserRepository from "../../DB/repositories/user.repository";
import { AppError } from "../../common/utils/global-error-handler";
import { encrypt } from "./../../common/utils/security/encrypt.security";
import { Compare, Hash } from "../../common/utils/security/hash.security";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { emailTemplete } from "../../common/utils/email/email.templete";
import { eventEmitter } from "../../common/utils/email/email.events";
import { EmailEnum } from "../../common/enum/email.enum";
import {
  block_otp_key,
  blocked_login_key,
  count_login_key,
  deleteKey,
  expire,
  get,
  get_key,
  get_ttl,
  incr,
  keys,
  max_otp_key,
  otp_key,
  revoked_key,
  setValue,
} from "../../DB/redis/redis.service";
import { ProviderEnum } from "../../common/enum/user.enum";
import { OAuth2Client } from "google-auth-library";
import {
  ACCESS_SECRET_KEY,
  REFRESH_SECRET_KEY,
  WEB_CLIENT_ID,
} from "../../config/config.service";
import { GenerateToken } from "../../common/utils/token.service";
import { randomUUID } from "node:crypto";
import { IRequest } from "../../common/middleware/authentication";

class AuthService {
  private readonly _userModle = new UserRepository();
  constructor() {}

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    const {
      userName,
      email,
      password,
      cPassword,
      gender,
      age,
      address,
      phone,
    }: ISignUpType = req.body;

    if (password !== cPassword) {
      throw new AppError(" password not matched", 400);
    }
    await this._userModle.checkUserAccount(email);

    const user = await this._userModle.create({
      userName,
      email,
      password: await Hash({ plainText: password }),
      gender,
      age,
      address,
      phone: phone ? encrypt(phone!) : null,
    } as Partial<IUser>);

    let otp = await generateOtp();

    eventEmitter.emit(EmailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "confirmation Email",
        html: emailTemplete(otp),
      });
    });

    await setValue({
      key: otp_key({ email, subject: EmailEnum.confirmEmail }),
      value: await Hash({
        plainText: `${otp}`,
      }),
      ttl: 2 * 60,
    });

    await setValue({
      key: max_otp_key({ email, subject: EmailEnum.confirmEmail }),
      value: 1,
      ttl: 6 * 60,
    });

    return res.status(200).json({
      message: "User signed up Successfully",
      success: true,
      data: user,
    });
  };
  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, code } = req.body;
    const otpValue = await get(
      otp_key({ email, subject: EmailEnum.confirmEmail }),
    );
    if (!otpValue) {
      throw new AppError("otp expired", 400);
    }
    if (!(await Compare({ plainText: code, cipherText: otpValue }))) {
      throw new AppError("Invalid Otp", 400);
    }

    const user = await this._userModle.findOneAndUpdate({
      filter: {
        email,
        confirmed: { $exists: false },
        provider: ProviderEnum.system,
      },
      update: {
        confirmed: true,
      },
    });

    if (!user) {
      throw new AppError("user not Exist", 400);
    }

    await deleteKey(otp_key({ email, subject: EmailEnum.confirmEmail }));
    return res.status(201).json({
      message: "User confirmed Successfully",
      success: true,
    });
  };
  signUpWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;

    const client = new OAuth2Client(WEB_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: WEB_CLIENT_ID!,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid Google token", { cause: 400 });
    }

    const { name, email, email_verified } = payload;

    if (!email) {
      throw new Error("Email not provided by Google", { cause: 400 });
    }

    if (!email_verified) {
      throw new Error("Email not verified with Google", { cause: 400 });
    }

    let user = await this._userModle.findOne({
      filter: { email },
    });

    if (!user) {
      user = await this._userModle.create({
        email,
        userName: name,
        confirmed: true,
        provider: ProviderEnum.google,
      } as Partial<IUser>);
    }

    if (user.provider !== ProviderEnum.google) {
      throw new Error("please log in using your original provider", {
        cause: 400,
      });
    }

    const access_token = GenerateToken({
      payload: { id: user._id, email: user.email, provider: user.provider },
      secretOrPrivateKey: ACCESS_SECRET_KEY!,
      options: { expiresIn: "1h" },
    });

    return res.status(200).json({
      message: "sign in success",
      data: { access_token, user },
    });
  };
  signIn = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email && !password)
      throw new AppError("Email & Password are required", 406);
    if (!email) throw new AppError("Email is required", 406);
    if (!password) throw new AppError("Password is required", 406);

    const user = await this._userModle.findOne({
      filter: {
        email,
        confirmed: { $exists: true },
        provider: ProviderEnum.system,
      },
    });
    if (!user) {
      throw new AppError("user not exist", 404);
    }

    const ttl = await get_ttl(blocked_login_key({ email }));
    if (ttl && ttl > 0) {
      throw new AppError(
        `you are blocked, please try again after ${ttl} saconds`,
        400,
      );
    }

    if (!(await Compare({ plainText: password, cipherText: user.password }))) {
      //   return res.status(409).json({ message: "Invalid Password" });
      const attempts = await incr(count_login_key({ email }));

      if (attempts === 1) {
        await expire(count_login_key({ email }), 2 * 60);
      }

      if (attempts && attempts >= 5) {
        await setValue({
          key: blocked_login_key({ email }),
          value: 1,
          ttl: 5 * 60,
        });
      }
      throw new AppError("Invalid Password", 400);
    }
    const jwtid = randomUUID();

    const access_token = GenerateToken({
      payload: { id: user._id, email: user.email },
      secretOrPrivateKey: ACCESS_SECRET_KEY!,
      options: { expiresIn: "1h", jwtid },
    });
    const refresh_token = GenerateToken({
      payload: { id: user._id, email: user.email },
      secretOrPrivateKey: REFRESH_SECRET_KEY!,
      options: { expiresIn: "1y", jwtid },
    });

    await deleteKey(count_login_key({ email }));

    return res.status(200).json({
      message: "User signed in Successfully",
      data: { access_token: access_token, refresh_token },
    });
  };
  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) throw new Error("Email is required", { cause: 406 });

    const user = await this._userModle.findOne({
      filter: {
        email,
        confirmed: { $exists: true },
        provider: ProviderEnum.system,
      },
    });
    if (!user) {
      throw new AppError("user not exist", 404);
    }

    await this._userModle.sendEmailOtp({
      email,
      subject: EmailEnum.forgetPassword,
    });

    return res.status(201).json({
      message: "success",
    });
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, code, password } = req.body;
    if (!email) throw new AppError("Email is required", 406);
    const otpValue = await get(
      otp_key({ email, subject: EmailEnum.forgetPassword }),
    );
    if (!otpValue) {
      throw new AppError("otp expired");
    }

    if (!(await Compare({ plainText: code, cipherText: otpValue }))) {
      throw new AppError("Invalid Otp", 400);
    }

    const user = await this._userModle.findOneAndUpdate({
      filter: {
        email,
        confirmed: { $exists: true },
        provider: ProviderEnum.system,
      },
      update: {
        password: await Hash({ plainText: password }),
        changeCredential: new Date(),
      },
    });
    if (!user) {
      throw new AppError("user not exist", 404);
    }

    await deleteKey(otp_key({ email, subject: EmailEnum.forgetPassword }));

    return res.status(200).json({ message: "success" });
  };

  updatatPassword = async (
    req: IRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword) {
      throw new Error("New password is required", { cause: 400 });
    }

    if (oldPassword === newPassword) {
      throw new Error("New password must be different", { cause: 400 });
    }

    if (
      !(await Compare({
        plainText: oldPassword,
        cipherText: req.user!.password,
      }))
    ) {
      throw new Error("Invalid Password", { cause: 400 });
    }

    const hash = await Hash({ plainText: newPassword });

    req.user!.password = hash;
    req.user!.changeCredential = new Date();
    await req.user!.save();

    // to remove new password from response
    req.user!.password = undefined as any;

    res
      .status(200)
      .json({ message: "Password updated successfully", data: req.user });
  };

  logout = async (req: IRequest, res: Response, next: NextFunction) => {
    const { flag } = req.query;

    if (flag === "all") {
      req.user!.changeCredential = new Date();
      await req.user!.save();

      const keyList = await keys(get_key({ userId: req.user!._id.toString() }));
      if (keyList && keyList.length) {
        await Promise.all(keyList.map((k) => deleteKey(k)));
      }
    } else {
      await setValue({
        key: revoked_key({
          userId: req.user!._id.toString(),
          jti: req.decoded!.jti,
        }),
        value: `${req.decoded!.jti}`,
        ttl: req.decoded!.exp - Math.floor(Date.now() / 1000),
      });
    }

    return res.status(200).json({ message: "done" });
  };
}

export default new AuthService();
