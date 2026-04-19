import crypto from "node:crypto";
import { ENCRYPTION_KEY, IV_LENGTH } from "../../../config/config.service";

const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH); // GCM uses 12 bytes

  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  const parts = text.split(":");

  const [ivHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex!, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText!, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
