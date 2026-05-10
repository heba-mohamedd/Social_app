"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const encrypt_security_1 = require("./../../common/utils/security/encrypt.security");
const hash_security_1 = require("../../common/utils/security/hash.security");
const send_email_1 = require("../../common/utils/email/send.email");
const email_templete_1 = require("../../common/utils/email/email.templete");
const email_events_1 = require("../../common/utils/email/email.events");
const email_enum_1 = require("../../common/enum/email.enum");
const user_enum_1 = require("../../common/enum/user.enum");
const google_auth_library_1 = require("google-auth-library");
const config_service_1 = require("../../config/config.service");
const node_crypto_1 = require("node:crypto");
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const response_success_1 = require("../../common/utils/response.success");
const token_service_1 = __importDefault(require("../../common/services/token.service"));
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = __importDefault(require("../../common/services/notification.service"));
class AuthService {
    _userModle = new user_repository_1.default();
    _redisService = redis_service_1.default;
    _tokenService = token_service_1.default;
    _s3Service = new s3_service_1.S3Service();
    _notificationService = notification_service_1.default;
    constructor() { }
    sendEmailOtp = async ({ email, subject, }) => {
        const isBlocked = await this._redisService.get_ttl(this._redisService.block_otp_key({ email, subject }));
        if (isBlocked && isBlocked > 0) {
            throw new Error(`you are blocked ,please try again after ${isBlocked} seconds`);
        }
        const ttl = await this._redisService.get_ttl(this._redisService.otp_key({ email, subject }));
        if (ttl && ttl > 0) {
            throw new Error(`you can resend otp after ${ttl} seconds`);
        }
        const maxOtp = await this._redisService.getValue(this._redisService.max_otp_key({ email, subject }));
        if (maxOtp >= 3) {
            await this._redisService.setValue({
                key: this._redisService.block_otp_key({ email, subject }),
                value: 1,
                ttl: 15 * 60,
            });
            throw new Error(`Too many attempts. Please try again later.`);
        }
        const otp = await (0, send_email_1.generateOtp)();
        email_events_1.eventEmitter.emit(subject, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "social App",
                html: (0, email_templete_1.emailTemplete)(otp),
            });
        });
        await this._redisService.setValue({
            key: this._redisService.otp_key({ email, subject }),
            value: await (0, hash_security_1.Hash)({ plainText: `${otp}` }),
            ttl: 2 * 60,
        });
        const newCount = await this._redisService.incr(this._redisService.max_otp_key({ email, subject }));
        if (newCount === 1) {
            await this._redisService.expire(this._redisService.max_otp_key({ email, subject }), 6 * 60);
        }
    };
    signUp = async (req, res, next) => {
        const { firstName, lastName, email, password, cPassword, gender, age, address, phone, } = req.body;
        if (password !== cPassword) {
            throw new global_error_handler_1.AppError(" password not matched", 400);
        }
        await this._userModle.checkUserAccount(email);
        let otp = await (0, send_email_1.generateOtp)();
        console.log(otp);
        email_events_1.eventEmitter.emit(email_enum_1.EmailEnum.confirmEmail, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "confirmation Email",
                html: (0, email_templete_1.emailTemplete)(otp),
            });
            await this._redisService.setValue({
                key: this._redisService.otp_key({
                    email,
                    subject: email_enum_1.EmailEnum.confirmEmail,
                }),
                value: await (0, hash_security_1.Hash)({
                    plainText: `${otp}`,
                }),
                ttl: 2 * 60,
            });
            await this._redisService.setValue({
                key: this._redisService.max_otp_key({
                    email,
                    subject: email_enum_1.EmailEnum.confirmEmail,
                }),
                value: 1,
                ttl: 30 * 60,
            });
        });
        const user = await this._userModle.create({
            firstName,
            lastName,
            email,
            password: await (0, hash_security_1.Hash)({ plainText: password }),
            gender,
            age,
            address,
            phone: phone ? (0, encrypt_security_1.encrypt)(phone) : null,
        });
        return res.status(200).json({
            message: "User signed up Successfully",
            success: true,
            data: user,
        });
    };
    confirmEmail = async (req, res, next) => {
        const { email, code } = req.body;
        const otpValue = await this._redisService.getValue(this._redisService.otp_key({ email, subject: email_enum_1.EmailEnum.confirmEmail }));
        if (!otpValue) {
            throw new global_error_handler_1.AppError("otp expired", 400);
        }
        if (!(await (0, hash_security_1.Compare)({ plainText: code, cipherText: otpValue }))) {
            throw new global_error_handler_1.AppError("Invalid Otp", 400);
        }
        const user = await this._userModle.findOneAndUpdate({
            filter: {
                email,
                confirmed: { $exists: false },
                provider: user_enum_1.ProviderEnum.system,
            },
            update: {
                confirmed: true,
            },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("user not Exist", 400);
        }
        await this._redisService.deleteKey(this._redisService.otp_key({ email, subject: email_enum_1.EmailEnum.confirmEmail }));
        return (0, response_success_1.successResponse)({
            res,
            status: 200,
            message: "User confirmed Successfully",
        });
    };
    signUpWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client(config_service_1.WEB_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config_service_1.WEB_CLIENT_ID,
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
                provider: user_enum_1.ProviderEnum.google,
            });
        }
        if (user.provider !== user_enum_1.ProviderEnum.google) {
            throw new Error("please log in using your original provider", {
                cause: 400,
            });
        }
        const access_token = this._tokenService.GenerateToken({
            payload: { id: user._id, email: user.email, provider: user.provider },
            secretOrPrivateKey: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.ACCESS_SECRET_KEY_USER
                : config_service_1.ACCESS_SECRET_KEY_ADMIN,
            options: { expiresIn: "1h" },
        });
        return res.status(200).json({
            message: "sign in success",
            data: { access_token, user },
        });
    };
    signIn = async (req, res, next) => {
        const { email, password, fcm } = req.body;
        if (!email && !password)
            throw new global_error_handler_1.AppError("Email & Password are required", 406);
        if (!email)
            throw new global_error_handler_1.AppError("Email is required", 406);
        if (!password)
            throw new global_error_handler_1.AppError("Password is required", 406);
        const user = await this._userModle.findOne({
            filter: {
                email,
                confirmed: { $exists: true },
                provider: user_enum_1.ProviderEnum.system,
            },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("user not exist", 404);
        }
        const ttl = await this._redisService.get_ttl(this._redisService.blocked_login_key(email));
        if (ttl && ttl > 0) {
            throw new global_error_handler_1.AppError(`you are blocked, please try again after ${ttl} saconds`, 400);
        }
        if (!(await (0, hash_security_1.Compare)({ plainText: password, cipherText: user.password }))) {
            const attempts = await this._redisService.incr(this._redisService.count_login_key(email));
            if (attempts === 1) {
                await this._redisService.expire(this._redisService.count_login_key(email), 2 * 60);
            }
            if (attempts && attempts >= 5) {
                await this._redisService.setValue({
                    key: this._redisService.blocked_login_key(email),
                    value: 1,
                    ttl: 5 * 60,
                });
            }
            throw new global_error_handler_1.AppError("Invalid Password", 400);
        }
        const jwtid = (0, node_crypto_1.randomUUID)();
        const access_token = this._tokenService.GenerateToken({
            payload: { id: user._id, email: user.email },
            secretOrPrivateKey: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.ACCESS_SECRET_KEY_USER
                : config_service_1.ACCESS_SECRET_KEY_ADMIN,
            options: { expiresIn: "1h", jwtid },
        });
        const refresh_token = this._tokenService.GenerateToken({
            payload: { id: user._id, email: user.email },
            secretOrPrivateKey: user?.role == user_enum_1.RoleEnum.user
                ? config_service_1.REFRESH_SECRET_KEY_USER
                : config_service_1.REFRESH_SECRET_KEY_ADMIN,
            options: { expiresIn: "1y", jwtid },
        });
        await this._redisService.deleteKey(this._redisService.count_login_key(email));
        if (fcm) {
            await this._redisService.addFMC({ userId: user._id, FCMToken: fcm });
            const tokens = await this._redisService.getFMCs(user._id);
            await this._notificationService.sendNotifications({
                tokens,
                notification: {
                    title: `hi ${user.userName}`,
                    body: `new login at ${new Date()}`,
                },
            });
        }
        return res.status(200).json({
            message: "User signed in Successfully",
            data: { access_token: access_token, refresh_token },
        });
    };
    forgetPassword = async (req, res, next) => {
        const { email } = req.body;
        if (!email)
            throw new Error("Email is required", { cause: 406 });
        const user = await this._userModle.findOne({
            filter: {
                email,
                confirmed: { $exists: true },
                provider: user_enum_1.ProviderEnum.system,
            },
        });
        if (!user) {
            throw new Error("user not exist", { cause: 404 });
        }
        await this.sendEmailOtp({ email, subject: email_enum_1.EmailEnum.forgetPassword });
        (0, response_success_1.successResponse)({
            res,
            message: "success",
        });
    };
    resendOtp = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModle.findOne({
            filter: {
                email,
                confirmed: { $exists: false },
                provider: user_enum_1.ProviderEnum.system,
            },
        });
        if (!user) {
            throw new Error("user not Exist or already Confirmed", { cause: 400 });
        }
        await this.sendEmailOtp({ email, subject: email_enum_1.EmailEnum.confirmEmail });
        (0, response_success_1.successResponse)({ res, message: "OTP sent successfully" });
    };
    resetPassword = async (req, res, next) => {
        const { email, code, password } = req.body;
        if (!email)
            throw new global_error_handler_1.AppError("Email is required", 406);
        const otpValue = await this._redisService.getValue(this._redisService.otp_key({ email, subject: email_enum_1.EmailEnum.forgetPassword }));
        if (!otpValue) {
            throw new global_error_handler_1.AppError("otp expired");
        }
        if (!(await (0, hash_security_1.Compare)({ plainText: code, cipherText: otpValue }))) {
            throw new global_error_handler_1.AppError("Invalid Otp", 400);
        }
        const user = await this._userModle.findOneAndUpdate({
            filter: {
                email,
                confirmed: { $exists: true },
                provider: user_enum_1.ProviderEnum.system,
            },
            update: {
                password: await (0, hash_security_1.Hash)({ plainText: password }),
                changeCredential: new Date(),
            },
        });
        if (!user) {
            throw new global_error_handler_1.AppError("user not exist", 404);
        }
        await this._redisService.deleteKey(this._redisService.otp_key({ email, subject: email_enum_1.EmailEnum.forgetPassword }));
        return res.status(200).json({ message: "success" });
    };
    updatatPassword = async (req, res, next) => {
        const { oldPassword, newPassword } = req.body;
        if (!newPassword) {
            throw new Error("New password is required", { cause: 400 });
        }
        if (oldPassword === newPassword) {
            throw new Error("New password must be different", { cause: 400 });
        }
        if (!(await (0, hash_security_1.Compare)({
            plainText: oldPassword,
            cipherText: req.user.password,
        }))) {
            throw new Error("Invalid Password", { cause: 400 });
        }
        const hash = await (0, hash_security_1.Hash)({ plainText: newPassword });
        req.user.password = hash;
        req.user.changeCredential = new Date();
        await req.user.save();
        req.user.password = undefined;
        res
            .status(200)
            .json({ message: "Password updated successfully", data: req.user });
    };
    logout = async (req, res, next) => {
        const { flag } = req.query;
        if (flag === "all") {
            req.user.changeCredential = new Date();
            await req.user.save();
            const keyList = await this._redisService.keys(this._redisService.get_key(req.user._id));
            if (keyList && keyList.length) {
                await Promise.all(keyList.map((k) => this._redisService.deleteKey(k)));
            }
        }
        else {
            await this._redisService.setValue({
                key: this._redisService.revoked_key({
                    userId: req.user._id,
                    jti: req.decoded.jti ?? "",
                }),
                value: `${req.decoded.jti ?? ""}`,
                ttl: (req.decoded.exp ?? Math.floor(Date.now() / 1000)) -
                    Math.floor(Date.now() / 1000),
            });
        }
        return res.status(200).json({ message: "done" });
    };
    uploadImage = async (req, res, next) => {
        const { fileName, ContentType } = req.body;
        const { url, Key } = await this._s3Service.createSignedUrl({
            fileName,
            ContentType,
            path: `users/${req?.user?._id}`,
        });
        (0, response_success_1.successResponse)({ res, data: { url, Key } });
    };
}
exports.default = new AuthService();
