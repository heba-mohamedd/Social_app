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
const post_utils_1 = require("../../common/utils/post.utils");
const post_enum_1 = require("../../common/enum/post.enum");
class PostServise {
    _userModle = new user_repository_1.default();
    _postModle = new post_repository_1.default();
    _s3Service = new s3_service_1.S3Service();
    _redisService = redis_service_1.default;
    _tokenService = token_service_1.default;
    _notificationService = notification_service_1.default;
    constructor() { }
    createPost = async (req, res, next) => {
        const { content, allowComment, availability, attachments, tags, } = req.body;
        let mentions = [];
        let fcmTokens = [];
        if (tags?.length) {
            if (tags?.includes(req.user._id.toString())) {
                throw new global_error_handler_1.AppError("you can't mention yourself");
            }
            const mentionsTage = await this._userModle.find({
                filter: { _id: { $in: tags } },
            });
            if (mentionsTage.length !== tags.length) {
                throw new global_error_handler_1.AppError("invalid tag id");
            }
            for (const tag of mentionsTage) {
                mentions.push(tag._id);
                (await this._redisService.getFMCs(tag._id)).map((token) => fcmTokens.push(token));
            }
        }
        let urls = [];
        let folderId = (0, node_crypto_1.randomUUID)();
        if (req?.files) {
            urls = await this._s3Service.uploadFiles({
                files: req.files,
                path: `users/${req?.user?._id}/posts/${folderId}`,
                store_type: multer_enum_1.Store_Enum.memory,
            });
        }
        const post = await this._postModle.create({
            attachments: urls,
            content: content,
            createBy: req?.user?._id,
            tags: mentions,
            availability,
            allowComment,
            folderId,
        });
        if (!post) {
            await this._s3Service.deleteFiles(urls);
            throw new global_error_handler_1.AppError("fail to create post");
        }
        if (fcmTokens?.length) {
            await this._notificationService.sendNotifications({
                tokens: fcmTokens,
                notification: {
                    title: `you are mention on new post`,
                    body: content || "new post",
                },
            });
        }
        (0, response_success_1.successResponse)({ res, data: post });
    };
    getPosts = async (req, res, next) => {
        const availabilityFilter = (0, post_utils_1.AvailabilityPost)(req);
        const posts = await this._postModle.paginate({
            page: Number(req?.query?.page),
            limit: Number(req?.query?.limit),
            sort: { createdAt: -1 },
            search: req?.query?.search
                ? {
                    $and: [
                        {
                            $or: [
                                { content: { $regex: req?.query?.search, $options: "i" } },
                            ],
                        },
                        availabilityFilter,
                    ],
                }
                : availabilityFilter,
        });
        (0, response_success_1.successResponse)({ res, data: posts });
    };
    likePost = async (req, res, next) => {
        const { postId } = req.params;
        const { flag } = req.query;
        let updataQuery = {
            $addToSet: {
                likes: req.user._id,
            },
        };
        if (flag && flag == post_enum_1.Like_DisLike_Enum.disLike) {
            updataQuery = {
                $pull: {
                    likes: req.user._id,
                },
            };
        }
        const post = await this._postModle.findOneAndUpdate({
            filter: {
                _id: postId,
                ...(0, post_utils_1.AvailabilityPost)(req),
            },
            update: updataQuery,
            options: {
                new: true,
            },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("post not found or not authorized", 404);
        }
        (0, response_success_1.successResponse)({ res, data: post });
    };
    deletePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModle.findOneAndUpdate({
            filter: {
                _id: postId,
                createBy: req.user._id,
                deletedAt: { $exists: false },
            },
            update: { deletedAt: new Date() },
        });
        if (!post) {
            throw new global_error_handler_1.AppError("post not found or not authorized", 404);
        }
        (0, response_success_1.successResponse)({ res, message: "post deleted successfully" });
    };
}
exports.default = new PostServise();
