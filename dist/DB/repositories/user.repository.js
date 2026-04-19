"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_repository_1 = __importDefault(require("./base.repository"));
const user_model_1 = __importDefault(require("../models/user.model"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const redis_service_1 = require("../redis/redis.service");
const send_email_1 = require("../../common/utils/email/send.email");
const email_events_1 = require("../../common/utils/email/email.events");
const email_templete_1 = require("../../common/utils/email/email.templete");
const hash_security_1 = require("../../common/utils/security/hash.security");
class UserRepository extends base_repository_1.default {
    model;
    constructor(model = user_model_1.default) {
        super(model);
        this.model = model;
    }
    async checkUserAccount(email) {
        const user = await this.findOne({ filter: { email } });
        if (user) {
            throw new global_error_handler_1.AppError("email already exist", 409);
        }
        return user;
    }
    async sendEmailOtp({ email, subject }) {
        const isBlocked = await (0, redis_service_1.get_ttl)((0, redis_service_1.block_otp_key)({ email, subject }));
        if (isBlocked && isBlocked > 0) {
            throw new Error(`you are blocked ,please try again after ${isBlocked} seconds`);
        }
        const ttl = await (0, redis_service_1.get_ttl)((0, redis_service_1.otp_key)({ email, subject }));
        if (ttl && ttl > 0) {
            throw new Error(`you can resend otp after ${ttl} seconds`);
        }
        const maxOtp = await (0, redis_service_1.get)((0, redis_service_1.max_otp_key)({ email, subject }));
        if (maxOtp && maxOtp >= 3) {
            await (0, redis_service_1.setValue)({
                key: (0, redis_service_1.block_otp_key)({ email, subject }),
                value: 1,
                ttl: 5 * 60,
            });
            throw new Error(`Too many attempts. Please try again later.`);
        }
        const otp = await (0, send_email_1.generateOtp)();
        email_events_1.eventEmitter.emit(subject, async () => {
            await (0, send_email_1.sendEmail)({
                to: email,
                subject: "social app",
                html: (0, email_templete_1.emailTemplete)(otp),
            });
        });
        await (0, redis_service_1.setValue)({
            key: (0, redis_service_1.otp_key)({ email, subject }),
            value: await (0, hash_security_1.Hash)({ plainText: `${otp}` }),
            ttl: 2 * 60,
        });
        const newCount = await (0, redis_service_1.incr)((0, redis_service_1.max_otp_key)({ email, subject }));
        if (newCount === 1) {
            await (0, redis_service_1.expire)((0, redis_service_1.max_otp_key)({ email, subject }), 6 * 60);
        }
    }
    ;
}
exports.default = UserRepository;
