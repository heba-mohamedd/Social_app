"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgetPasswordSchema = exports.updataPasswordSchema = exports.confirmEmailSchema = exports.signInSchema = exports.signUpSchema = void 0;
const z = __importStar(require("zod"));
const user_enum_1 = require("../../common/enum/user.enum");
exports.signUpSchema = {
    body: z
        .strictObject({
        userName: z.string({ error: "userName is Required" }).min(3, "userName must be 3 or more characters").max(25),
        email: z.email("Invalid email address"),
        password: z.string().min(6),
        cPassword: z.string().min(6),
        age: z.coerce.number().min(15, "age must be 15 or more ").max(60),
        gender: z.enum(user_enum_1.GenderEnum).optional(),
        address: z.string().optional(),
        phone: z.string().min(11).max(11).optional(),
    })
        .refine((data) => data.password === data.cPassword, {
        message: "Passwords do not match",
        path: ["cPassword"],
    }),
};
exports.signInSchema = {
    body: z.object({
        email: z.email("inValid email address"),
        password: z.string().min(6),
    }),
};
exports.confirmEmailSchema = {
    body: z.object({
        email: z.email("inValid email address"),
        code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
    }),
};
exports.updataPasswordSchema = {
    body: z
        .object({
        newPassword: z.string().min(6),
        cPassword: z.string(),
        oldPassword: z.string().min(6),
    })
        .refine((data) => data.newPassword === data.cPassword, {
        message: "Passwords do not match",
        path: ["cPassword"],
    }),
};
exports.forgetPasswordSchema = {
    body: z.object({
        email: z.email("inValid email address"),
    }),
};
exports.resetPasswordSchema = {
    body: z
        .object({
        email: z.email("inValid email address"),
        code: z.string().regex(/^\d{6}$/),
        password: z.string().min(6),
    })
        .required(),
};
