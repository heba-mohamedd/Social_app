import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

class NotificationService {
  private readonly client: admin.app.App;

  constructor() {
    const serviceAccountPath = resolve(
      process.cwd(),
      "src/config/social-app-online-c89b8-firebase-adminsdk-fbsvc-6c734a8903.json",
    );

    const serviceAccount = JSON.parse(
      readFileSync(serviceAccountPath, "utf-8"),
    );

    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendNotification({
    token,
    notification,
  }: {
    token: string;
    notification: { title: string; body: string };
  }) {
    const message = { token, notification };
    return await this.client.messaging().send(message);
  }

  async sendNotifications({
    tokens,
    notification,
  }: {
    tokens: string[];
    notification: { title: string; body: string };
  }) {
    const message = { tokens, notification };
    await Promise.all(
      tokens.map((token) => {
        return this.sendNotification({ token, notification });
      }),
    );
  }
}

export default new NotificationService();
