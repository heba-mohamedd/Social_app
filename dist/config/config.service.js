"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_SECRET_KEY = exports.ACCESS_SECRET_KEY = exports.WEB_CLIENT_ID = exports.REDIS_URL = exports.PREFIX = exports.PASSWORD = exports.EMAIL = exports.SALT_ROUNDS = exports.IV_LENGTH = exports.ENCRYPTION_KEY = exports.MONGO_DB = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = require("node:path");
const NODE_ENV = process.env.NODE_ENV;
dotenv_1.default.config({
    path: (0, node_path_1.resolve)(__dirname, `../../.env.${NODE_ENV}`),
});
exports.PORT = Number(process.env.PORT) || 3000;
exports.MONGO_DB = process.env.MONGO_DB;
exports.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "utf-8");
exports.IV_LENGTH = Number(process.env.IV_LENGTH) || 12;
exports.SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 12;
exports.EMAIL = process.env.EMAIL;
exports.PASSWORD = process.env.PASSWORD;
exports.PREFIX = process.env.PREFIX;
exports.REDIS_URL = process.env.REDIS_URL;
exports.WEB_CLIENT_ID = process.env.WEB_CLIENT_ID;
exports.ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY;
exports.REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;
