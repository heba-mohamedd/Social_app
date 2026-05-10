import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
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
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { KEY } from "./../../../node_modules/@aws-crypto/sha256-js/build/module/constants";

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

  async createSignedUrl({
    path,
    fileName,
    ContentType,
    expiresIn = 60,
  }: {
    path: string;
    fileName: string;
    ContentType: string;
    expiresIn?: number;
  }) {
    const Key = `social_media_app/${path}/${randomUUID()}__${fileName}`;
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      ContentType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });

    return { url, Key };
  }

  async getFile(Key: string) {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });
    return await this.client.send(command);
  }

  async getPreSignedUrl({
    Key,
    expiresIn = 60,
    download,
  }: {
    Key: string;
    expiresIn?: number;
    download?: string | undefined;
  }) {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
      ResponseContentDisposition: download
        ? `attachment; filename="${Key.split("/").pop()}"`
        : undefined,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url;
  }

  async getFiles(folderName: string) {
    const command = new ListObjectsV2Command({
      Bucket: AWS_BUCKET_NAME,
      Prefix: `social_media_app/users/${folderName}`,
    });
    return await this.client.send(command);
  }
  async deleteFile(Key: string) {
    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key,
    });
    return await this.client.send(command);
  }
  async deleteFiles(Keys: string[]) {
    const keyMapped = Keys.map((k) => {
      return {
        Key: k,
      };
    });
    const command = new DeleteObjectsCommand({
      Bucket: AWS_BUCKET_NAME,
      Delete: {
        Objects: keyMapped,
        // Quiet: true, // it is defult to return deleted items
      },
    });
    return await this.client.send(command);
  }
  async deleteFolder(folderName: string) {
    const result = await this.getFiles(folderName);
    const resultMapped = result.Contents?.map((file) => {
      return file.Key;
    });

    return await this.deleteFiles(resultMapped as string[]);
  }
}
