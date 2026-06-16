"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication_gql = exports.authentication = exports.decodeToken_and_fetchUser = void 0;
const redis_service_js_1 = __importDefault(require("../services/redis.service.js"));
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const token_service_1 = __importDefault(require("../services/token.service"));
const global_error_handler_1 = require("../utils/global-error-handler");
const config_service_js_1 = require("../../config/config.service.js");
const _userModel = new user_repository_1.default();
const decodeToken_and_fetchUser = async (authorization) => {
    if (!authorization) {
        throw new global_error_handler_1.AppError("token not exist");
    }
    const [prefix, token] = authorization.split(" ");
    if (!token) {
        throw new global_error_handler_1.AppError("token not found");
    }
    let ACCESS_SECRET_KEY = "";
    if (prefix == config_service_js_1.PREFIX_USER) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix == config_service_js_1.PREFIX_ADMIN) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_ADMIN;
    }
    else {
        throw new global_error_handler_1.AppError("inValid token Prefix");
    }
    const decoded = token_service_1.default.VerifyToken({
        token: token,
        secretOrPublicKey: ACCESS_SECRET_KEY,
    });
    if (!decoded || !decoded?.id) {
        throw new global_error_handler_1.AppError("inValid token");
    }
    const user = await _userModel.findOne({
        filter: {
            _id: decoded.id,
        },
    });
    if (!user) {
        throw new global_error_handler_1.AppError("user not exist", 404);
    }
    return { user, decoded };
};
exports.decodeToken_and_fetchUser = decodeToken_and_fetchUser;
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    const { user, decoded } = await (0, exports.decodeToken_and_fetchUser)(authorization);
    if (user?.changeCredential &&
        user?.changeCredential?.getTime() > decoded.iat * 1000) {
        throw new global_error_handler_1.AppError("inValid token");
    }
    const revokeToken = await redis_service_js_1.default.getValue(redis_service_js_1.default.revoked_key({ userId: user._id, jti: decoded.jti }));
    if (revokeToken) {
        throw new global_error_handler_1.AppError("inValid token revoked");
    }
    req.user = user;
    req.decoded = decoded;
    next();
};
exports.authentication = authentication;
const authentication_gql = async (authorization) => {
    if (!authorization) {
        throw new global_error_handler_1.AppError("token not exist");
    }
    const [prefix, token] = authorization.split(" ");
    if (!token) {
        throw new global_error_handler_1.AppError("token not found");
    }
    let ACCESS_SECRET_KEY = "";
    if (prefix == config_service_js_1.PREFIX_USER) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_USER;
    }
    else if (prefix == config_service_js_1.PREFIX_ADMIN) {
        ACCESS_SECRET_KEY = config_service_js_1.ACCESS_SECRET_KEY_ADMIN;
    }
    else {
        throw new global_error_handler_1.AppError("inValid token Prefix");
    }
    const decoded = token_service_1.default.VerifyToken({
        token: token,
        secretOrPublicKey: ACCESS_SECRET_KEY,
    });
    if (!decoded || !decoded?.id) {
        throw new global_error_handler_1.AppError("inValid token");
    }
    const user = await _userModel.findOne({
        filter: {
            _id: decoded.id,
        },
    });
    if (!user) {
        throw new global_error_handler_1.AppError("user not exist", 404);
    }
    if (user?.changeCredential &&
        user?.changeCredential?.getTime() > decoded.iat * 1000) {
        throw new global_error_handler_1.AppError("inValid token");
    }
    const revokeToken = await redis_service_js_1.default.getValue(redis_service_js_1.default.revoked_key({ userId: user._id, jti: decoded.jti }));
    if (revokeToken) {
        throw new global_error_handler_1.AppError("inValid token revoked");
    }
    return { user, decoded };
};
exports.authentication_gql = authentication_gql;
