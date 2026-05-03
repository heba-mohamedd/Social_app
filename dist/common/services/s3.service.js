"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_service_1 = require("../../config/config.service");
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../enum/multer.enum");
const node_fs_1 = __importDefault(require("node:fs"));
const global_error_handler_1 = require("../utils/global-error-handler");
const lib_storage_1 = require("@aws-sdk/lib-storage");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_service_1.AWS_REGION,
            credentials: {
                accessKeyId: config_service_1.AWS_ACCESS_KEY,
                secretAccessKey: config_service_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadFile({ file, ACL = client_s3_1.ObjectCannedACL.private, path = "General", store_type = multer_enum_1.Store_Enum.memory, }) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: config_service_1.AWS_BUCKET_NAME,
            ACL,
            Key: `social_media_app/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            Body: store_type === multer_enum_1.Store_Enum.memory
                ? file.buffer
                : node_fs_1.default.createReadStream(file.path),
            ContentType: file.mimetype,
        });
        if (!command.input.Key) {
            throw new global_error_handler_1.AppError("fail to upload file");
        }
        await this.client.send(command);
        return command.input.Key;
    }
    async uploadLargeFile({ file, ACL = client_s3_1.ObjectCannedACL.private, path = "General", store_type = multer_enum_1.Store_Enum.disk, }) {
        const command = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: config_service_1.AWS_BUCKET_NAME,
                ACL,
                Key: `social_media_app/${path}/large/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                Body: store_type === multer_enum_1.Store_Enum.memory
                    ? file.buffer
                    : node_fs_1.default.createReadStream(file.path),
                ContentType: file.mimetype,
            },
        });
        const result = await command.done();
        command.on("httpUploadProgress", (progress) => {
            console.log(progress);
        });
        return result.Key;
    }
    async uploadFiles({ files, ACL = client_s3_1.ObjectCannedACL.private, path = "General", store_type = multer_enum_1.Store_Enum.memory, isLarge = false, }) {
        let urls = [];
        if (isLarge) {
            urls = await Promise.all(files.map((file) => {
                return this.uploadLargeFile({
                    file,
                    ACL,
                    path,
                    store_type,
                });
            }));
        }
        else {
            urls = await Promise.all(files.map((file) => {
                return this.uploadFile({
                    file,
                    ACL,
                    path,
                    store_type,
                });
            }));
        }
        return urls;
    }
}
exports.S3Service = S3Service;
