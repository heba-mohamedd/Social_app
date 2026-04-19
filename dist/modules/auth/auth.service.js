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
const redis_service_1 = require("../../DB/redis/redis.service");
const user_enum_1 = require("../../common/enum/user.enum");
const google_auth_library_1 = require("google-auth-library");
const config_service_1 = require("../../config/config.service");
const token_service_1 = require("../../common/utils/token.service");
const node_crypto_1 = require("node:crypto");
class AuthService {
    _userModle = new user_repository_1.default();
    constructor() { }
    signUp = async (req, res, next) => {
        const { userName, email, password, cPassword, gender, age, address, phone, } = req.body;
        if (password !== cPassword) {
            throw new global_error_handler_1.AppError(" password not matched", 400);
        }
        await this._userModle.checkUserAccount(email);
        const user = await this._userModle.create({
            userName,
            email,
            password: await (0, hash_security_1.Hash)({ plainText: password }),
            gender,
            age,
            address,
            phone: phone ? (0, encrypt_security_1.encrypt)(phone) : null,
        });
        let otp = await (0, send_email_1.generateOtp)();
        email_events_1.eventEmitter.emit(email_enum_1.EmailEnum.confirmEmail, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "confirmation Email",
                html: (0, email_templete_1.emailTemplete)(otp),
            });
        });
        await (0, redis_service_1.setValue)({
            key: (0, redis_service_1.otp_key)({ email, subject: email_enum_1.EmailEnum.confirmEmail }),
            value: await (0, hash_security_1.Hash)({
                plainText: `${otp}`,
            }),
            ttl: 2 * 60,
        });
        await (0, redis_service_1.setValue)({
            key: (0, redis_service_1.max_otp_key)({ email, subject: email_enum_1.EmailEnum.confirmEmail }),
            value: 1,
            ttl: 6 * 60,
        });
        return res.status(200).json({
            message: "User signed up Successfully",
            success: true,
            data: user,
        });
    };
    confirmEmail = async (req, res, next) => {
        const { email, code } = req.body;
        const otpValue = await (0, redis_service_1.get)((0, redis_service_1.otp_key)({ email, subject: email_enum_1.EmailEnum.confirmEmail }));
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
        await (0, redis_service_1.deleteKey)((0, redis_service_1.otp_key)({ email, subject: email_enum_1.EmailEnum.confirmEmail }));
        return res.status(201).json({
            message: "User confirmed Successfully",
            success: true,
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
        const access_token = (0, token_service_1.GenerateToken)({
            payload: { id: user._id, email: user.email, provider: user.provider },
            secretOrPrivateKey: config_service_1.ACCESS_SECRET_KEY,
            options: { expiresIn: "1h" },
        });
        return res.status(200).json({
            message: "sign in success",
            data: { access_token, user },
        });
    };
    signIn = async (req, res, next) => {
        const { email, password } = req.body;
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
        const ttl = await (0, redis_service_1.get_ttl)((0, redis_service_1.blocked_login_key)({ email }));
        if (ttl && ttl > 0) {
            throw new global_error_handler_1.AppError(`you are blocked, please try again after ${ttl} saconds`, 400);
        }
        if (!(await (0, hash_security_1.Compare)({ plainText: password, cipherText: user.password }))) {
            const attempts = await (0, redis_service_1.incr)((0, redis_service_1.count_login_key)({ email }));
            if (attempts === 1) {
                await (0, redis_service_1.expire)((0, redis_service_1.count_login_key)({ email }), 2 * 60);
            }
            if (attempts && attempts >= 5) {
                await (0, redis_service_1.setValue)({
                    key: (0, redis_service_1.blocked_login_key)({ email }),
                    value: 1,
                    ttl: 5 * 60,
                });
            }
            throw new global_error_handler_1.AppError("Invalid Password", 400);
        }
        const jwtid = (0, node_crypto_1.randomUUID)();
        const access_token = (0, token_service_1.GenerateToken)({
            payload: { id: user._id, email: user.email },
            secretOrPrivateKey: config_service_1.ACCESS_SECRET_KEY,
            options: { expiresIn: "1h", jwtid },
        });
        const refresh_token = (0, token_service_1.GenerateToken)({
            payload: { id: user._id, email: user.email },
            secretOrPrivateKey: config_service_1.REFRESH_SECRET_KEY,
            options: { expiresIn: "1y", jwtid },
        });
        await (0, redis_service_1.deleteKey)((0, redis_service_1.count_login_key)({ email }));
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
            throw new global_error_handler_1.AppError("user not exist", 404);
        }
        await this._userModle.sendEmailOtp({
            email,
            subject: email_enum_1.EmailEnum.forgetPassword,
        });
        return res.status(201).json({
            message: "success",
        });
    };
    resetPassword = async (req, res, next) => {
        const { email, code, password } = req.body;
        if (!email)
            throw new global_error_handler_1.AppError("Email is required", 406);
        const otpValue = await (0, redis_service_1.get)((0, redis_service_1.otp_key)({ email, subject: email_enum_1.EmailEnum.forgetPassword }));
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
        await (0, redis_service_1.deleteKey)((0, redis_service_1.otp_key)({ email, subject: email_enum_1.EmailEnum.forgetPassword }));
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
            const keyList = await (0, redis_service_1.keys)((0, redis_service_1.get_key)({ userId: req.user._id.toString() }));
            if (keyList && keyList.length) {
                await Promise.all(keyList.map((k) => (0, redis_service_1.deleteKey)(k)));
            }
        }
        else {
            await (0, redis_service_1.setValue)({
                key: (0, redis_service_1.revoked_key)({
                    userId: req.user._id.toString(),
                    jti: req.decoded.jti,
                }),
                value: `${req.decoded.jti}`,
                ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
            });
        }
        return res.status(200).json({ message: "done" });
    };
}
exports.default = new AuthService();
