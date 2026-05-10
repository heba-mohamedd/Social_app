"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class NotificationService {
    client;
    constructor() {
        const serviceAccountPath = (0, node_path_1.resolve)(process.cwd(), "src/config/social-app-online-c89b8-firebase-adminsdk-fbsvc-6c734a8903.json");
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)(serviceAccountPath, "utf-8"));
        this.client = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
    async sendNotification({ token, notification, }) {
        const message = { token, notification };
        return await this.client.messaging().send(message);
    }
    async sendNotifications({ tokens, notification, }) {
        const message = { tokens, notification };
        await Promise.all(tokens.map((token) => {
            return this.sendNotification({ token, notification });
        }));
    }
}
exports.default = new NotificationService();
