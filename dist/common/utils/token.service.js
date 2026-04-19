"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyToken = exports.GenerateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const GenerateToken = ({ payload, secretOrPrivateKey, options = {}, }) => {
    return jsonwebtoken_1.default.sign(payload, secretOrPrivateKey, options);
};
exports.GenerateToken = GenerateToken;
const VerifyToken = ({ token, secretOrPublicKey, options = {}, }) => {
    return jsonwebtoken_1.default.verify(token, secretOrPublicKey, options);
};
exports.VerifyToken = VerifyToken;
