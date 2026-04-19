import { Model } from "mongoose";
import BaseRepository from "./base.repository";
import UserModel, { IUser } from "../models/user.model";
import { AppError } from "../../common/utils/global-error-handler";
import { block_otp_key, expire, get, get_ttl, incr, max_otp_key, otp_key, setValue } from "../redis/redis.service";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email";
import { eventEmitter } from "../../common/utils/email/email.events";
import { emailTemplete } from "../../common/utils/email/email.templete";
import { Hash } from "../../common/utils/security/hash.security";

class UserRepository extends BaseRepository<IUser> {
  constructor(protected readonly model: Model<IUser> = UserModel) {
    super(model);
  }

  async checkUserAccount(email: string) {
    const user = await this.findOne({ filter: { email } });

    if (user) {
      throw new AppError("email already exist", 409);
    }

    return user;
  }

  async sendEmailOtp ({email,subject}: {
      email: string;
      subject: string;
    }) {
      const isBlocked = await get_ttl(block_otp_key({ email, subject }));
      if (isBlocked && isBlocked > 0) {
        throw new Error(
          `you are blocked ,please try again after ${isBlocked} seconds`,
        );
      }
      const ttl = await get_ttl(otp_key({ email, subject }));
      if (ttl && ttl > 0) {
        throw new Error(`you can resend otp after ${ttl} seconds`);
      }
      const maxOtp = await get(max_otp_key({ email, subject }));
      if (maxOtp && maxOtp >= 3) {
        await setValue({
          key: block_otp_key({ email, subject }),
          value: 1,
          ttl: 5 * 60,
        });
        throw new Error(`Too many attempts. Please try again later.`);
      }
  
      const otp = await generateOtp();
  
      // Fire-and-forget: send email asynchronously via event
      eventEmitter.emit(subject, async () => {
        await sendEmail({
          to: email,
          subject: "social app",
          html: emailTemplete(otp),
        });
      });
  
      // OTP storage MUST be outside the event callback to guarantee it's saved
      await setValue({
        key: otp_key({ email, subject }),
        value: await Hash({ plainText: `${otp}` }),
        ttl: 2 * 60,
      });
      const newCount = await incr(max_otp_key({ email, subject }));
      if (newCount === 1) {
        await expire(max_otp_key({ email, subject }), 6 * 60);
      }
    };
}

export default UserRepository;
