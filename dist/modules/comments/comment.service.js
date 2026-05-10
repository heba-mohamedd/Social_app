"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const response_success_1 = require("../../common/utils/response.success");
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const token_service_1 = __importDefault(require("../../common/services/token.service"));
const s3_service_1 = require("../../common/services/s3.service");
const notification_service_1 = __importDefault(require("../../common/services/notification.service"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const post_repository_1 = __importDefault(require("../../DB/repositories/post.repository"));
const node_crypto_1 = require("node:crypto");
const multer_enum_1 = require("../../common/enum/multer.enum");
const post_enum_1 = require("../../common/enum/post.enum");
const comment_repository_1 = __importDefault(require("../../DB/repositories/comment.repository"));
const post_utils_1 = require("../../common/utils/post.utils");
class PostServise {
    _userModle = new user_repository_1.default();
    _postModle = new post_repository_1.default();
    _commentModle = new comment_repository_1.default();
    _s3Service = new s3_service_1.S3Service();
    _redisService = redis_service_1.default;
    _tokenService = token_service_1.default;
    _notificationService = notification_service_1.default;
    constructor() { }
    createcomment = async (req, res, next) => {
        const { content, attachments, tags } = req.body;
        const { postId } = req.params;
        const post = await this._postModle.findOne({
            filter: {
                _id: postId,
                $or: [...(0, post_utils_1.PostAvailability)(req)],
                allowComment: post_enum_1.Allow_Comment_Enum.allow,
            },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("post not found");
        }
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            const mentionsTage = await this._userModle.find({
                filter: { _id: { $in: tags } },
            });
            if (mentionsTage.length != tags?.length) {
                throw new global_error_handler_1.AppError("invalid tag id");
            }
            for (const tag of mentionsTage) {
                mentions.push(tag._id);
                fcmTokens.push(...(await this._redisService.getFMCs(tag._id)));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${folderId}/comments/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory,
            });
        }
        const comment = await this._commentModle.create({
            attachments: urls,
            content: content || "",
            createBy: req?.user?._id,
            tags: mentions,
            folderId,
            postId: post._id,
        });
        if (!comment) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handler_1.AppError("fail to create post");
        }
        if (fcmTokens?.length) {
            await this._notificationService.sendNotifications({
                tokens: fcmTokens,
                notification: {
                    title: "You were mentioned in a comment",
                    body: content || "New comment",
                },
            });
        }
        (0, response_success_1.successResponse)({ res, data: comment });
    };
}
exports.default = new PostServise();
