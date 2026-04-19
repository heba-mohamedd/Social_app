"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation = void 0;
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const Validation = (schema) => {
    return async (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const result = await schema[key].safeParseAsync(req[key]);
            if (!result.success) {
                validationError.push(JSON.parse(result.error.message));
            }
        }
        if (validationError.length > 0) {
            return next(new global_error_handler_1.AppError(validationError, 400));
        }
        next();
    };
};
exports.Validation = Validation;
