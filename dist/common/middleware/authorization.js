"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const global_error_handler_1 = require("../utils/global-error-handler");
const authorization = (roles = []) => {
    return async (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new global_error_handler_1.AppError("UnAuthorized", 403);
        }
        next();
    };
};
exports.authorization = authorization;
