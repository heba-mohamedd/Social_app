import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  AWS_ACCESS_KEY,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../config/config.service";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../enum/multer.enum";
import fs from "node:fs";
import { AppError } from "../utils/global-error-handler";
import { Upload } from "@aws-sdk/lib-storage";

export class S3Service {
  private client: S3Client;
  constructor() {
    this.client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  async uploadFile({
    file,
    ACL = ObjectCannedACL.private,
    path = "General",
    store_type = Store_Enum.memory,
  }: {
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    path?: string;
    store_type?: Store_Enum;
  }) {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      ACL,
      Key: `social_media_app/${path}/${randomUUID()}__${file.originalname}`,
      Body:
        store_type === Store_Enum.memory
          ? file.buffer
          : fs.createReadStream(file.path),
      ContentType: file.mimetype,
    });

    if (!command.input.Key) {
      throw new AppError("fail to upload file");
    }
    await this.client.send(command);

    return command.input.Key;
  }
  async uploadLargeFile({
    file,
    ACL = ObjectCannedACL.private,
    path = "General",
    store_type = Store_Enum.disk,
  }: {
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    path?: string;
    store_type?: Store_Enum;
  }) {
    const command = new Upload({
      client: this.client,
      params: {
        Bucket: AWS_BUCKET_NAME,
        ACL,
        Key: `social_media_app/${path}/large/${randomUUID()}__${file.originalname}`,
        Body:
          store_type === Store_Enum.memory
            ? file.buffer
            : fs.createReadStream(file.path),
        ContentType: file.mimetype,
      },
    });

    const result = await command.done();
    command.on("httpUploadProgress", (progress) => {
      console.log(progress);
    });

    return result.Key!;
  }

  async uploadFiles({
    files,
    ACL = ObjectCannedACL.private,
    path = "General",
    store_type = Store_Enum.memory,
    isLarge = false,
  }: {
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    path?: string;
    store_type?: Store_Enum;
    isLarge?: boolean;
  }) {
    let urls: string[] = [];

    if (isLarge) {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadLargeFile({
            file,
            ACL,
            path,
            store_type,
          });
        }),
      );
    } else {
      urls = await Promise.all(
        files.map((file) => {
          return this.uploadFile({
            file,
            ACL,
            path,
            store_type,
          });
        }),
      );
    }

    return urls;
  }
}
