import dotenv from "dotenv";
import { resolve } from "node:path";

const NODE_ENV = process.env.NODE_ENV; // return development Or production

dotenv.config({
  path: resolve(__dirname, `../../.env.${NODE_ENV}`),
});

export const PORT: number = Number(process.env.PORT) || 3000;
export const MONGO_DB: string = process.env.MONGO_DB!;
export const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "utf-8");
export const IV_LENGTH: number = Number(process.env.IV_LENGTH) || 12;
export const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS) || 12;
export const EMAIL = process.env.EMAIL;
export const PASSWORD = process.env.PASSWORD;

export const PREFIX_USER = process.env.PREFIX_USER!;
export const PREFIX_ADMIN = process.env.PREFIX_ADMIN!;

export const REDIS_URL = process.env.REDIS_URL!;

export const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID!;
export const ACCESS_SECRET_KEY_USER = process.env.ACCESS_SECRET_KEY_USER;
export const REFRESH_SECRET_KEY_USER = process.env.REFRESH_SECRET_KEY_USER;
export const ACCESS_SECRET_KEY_ADMIN = process.env.ACCESS_SECRET_KEY_ADMIN;
export const REFRESH_SECRET_KEY_ADMIN = process.env.REFRESH_SECRET_KEY_ADMIN;
