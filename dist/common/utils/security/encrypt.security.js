"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const node_crypto_1 = __importDefault(require("node:crypto"));
const config_service_1 = require("../../../config/config.service");
const ALGORITHM = "aes-256-gcm";
function encrypt(text) {
    const iv = node_crypto_1.default.randomBytes(config_service_1.IV_LENGTH);
    const cipher = node_crypto_1.default.createCipheriv(ALGORITHM, config_service_1.ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
}
function decrypt(text) {
    const parts = text.split(":");
    const [ivHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = node_crypto_1.default.createDecipheriv(ALGORITHM, config_service_1.ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
