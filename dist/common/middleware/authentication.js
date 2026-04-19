"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const redis_service_js_1 = require("../../DB/redis/redis.service.js");
const user_repository_js_1 = __importDefault(require("../../DB/repositories/user.repository.js"));
const config_service_js_1 = require("../../config/config.service.js");
const token_service_js_1 = require("../utils/token.service.js");
const global_error_handler_js_1 = require("../utils/global-error-handler.js");
const authentication = async (req, res, next) => {
    const userRepository = new user_repository_js_1.default();
    const { authentication } = req.headers;
    if (!authentication || typeof authentication !== "string") {
        throw new global_error_handler_js_1.AppError("Invalid authorization header", 401);
    }
    const [prefix, token] = authentication.split(" ") || [];
    if (!prefix || !token) {
        throw new global_error_handler_js_1.AppError("Invalid authorization format", 401);
    }
    if (prefix !== config_service_js_1.PREFIX) {
        throw new global_error_handler_js_1.AppError("inValid token Prefix", 401);
    }
    const decoded = (0, token_service_js_1.VerifyToken)({
        token: token,
        secretOrPublicKey: config_service_js_1.ACCESS_SECRET_KEY,
    });
    if (!decoded || !decoded?.id) {
        throw new global_error_handler_js_1.AppError("inValid token", 401);
    }
    const user = await userRepository.findOne({
        filter: {
            _id: decoded.id,
        },
    });
    if (!user) {
        throw new global_error_handler_js_1.AppError("user not exist", 404);
    }
    if (user.changeCredential && user.changeCredential.getTime() > decoded.iat * 1000) {
        throw new global_error_handler_js_1.AppError("inValid token", 401);
    }
    const revokeToken = await (0, redis_service_js_1.get)((0, redis_service_js_1.revoked_key)({ userId: user._id.toString(), jti: decoded.jti }));
    if (revokeToken) {
        throw new global_error_handler_js_1.AppError("inValid token revoked", 401);
    }
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
