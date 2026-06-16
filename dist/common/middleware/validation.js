"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validation_GQL = exports.Validation = void 0;
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const graphql_1 = require("graphql");
const Validation = (schema) => {
    return async (req, res, next) => {
        const validationError = [];
        if (!req.body)
            req.body = {};
        if (req?.file) {
            req.body.attachment = req.file;
        }
        if (req?.files) {
            req.body.attachments = req.files;
        }
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
const Validation_GQL = async (schema, data) => {
    const validationError = [];
    const result = await schema.safeParseAsync(data);
    if (!result.success) {
        const errors = result.error.issues.map((err) => {
            return {
                path: err.path[0],
                message: err.message,
            };
        });
        validationError.push(...errors);
    }
    if (validationError.length > 0) {
        throw new graphql_1.GraphQLError("validation failed", {
            extensions: {
                code: "BAD_REQUEST",
                status: 400,
                message: validationError,
            },
        });
    }
};
exports.Validation_GQL = Validation_GQL;
