"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_repository_1 = __importDefault(require("../../DB/repositories/chat.repository"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
const response_success_1 = require("../../common/utils/response.success");
const user_repository_1 = __importDefault(require("../../DB/repositories/user.repository"));
const redis_service_1 = __importDefault(require("../../common/services/redis.service"));
const mongoose_1 = require("mongoose");
const zod_1 = require("zod");
const s3_service_1 = require("../../common/services/s3.service");
class ChatService {
    _chatModel = new chat_repository_1.default();
    _userModle = new user_repository_1.default();
    _s3Service = new s3_service_1.S3Service();
    constructor() { }
    getChat = async (req, res, next) => {
        const { userId } = req.params;
        let { limit, page = 1 } = req.query;
        if (page < 0)
            page = 1;
        page = page * 1 || 1;
        limit = limit * 1 || 5;
        const chat = await this._chatModel.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id, userId],
                },
                group: { $exists: false },
            },
            projection: {
                messages: {
                    $slice: [-(page * limit), limit],
                },
            },
            options: {
                populate: [
                    { path: "participants", select: "firstName lastName profilePicture" },
                ],
            },
        });
        (0, response_success_1.successResponse)({ res, message: "Done", data: { chat } });
    };
    getGroupChat = async (req, res, next) => {
        const { groupId } = req.params;
        let { limit, page = 1 } = req.query;
        if (page < 0)
            page = 1;
        page = page * 1 || 1;
        limit = limit * 1 || 5;
        const chat = await this._chatModel.findOne({
            filter: {
                _id: groupId,
                participants: {
                    $in: [req.user?._id],
                },
                group: { $exists: true },
            },
            projection: {
                messages: {
                    $slice: [-(page * limit), limit],
                },
            },
            options: {
                populate: [{ path: "messages.createdBy" }],
            },
        });
        if (!chat) {
            throw new global_error_handler_1.AppError("chat not found", 404);
        }
        (0, response_success_1.successResponse)({ res, message: "Done", data: { chat } });
    };
    createGroupChat = async (req, res, next) => {
        let { group, groupImage, participants } = req.body;
        const createdBy = req.user?._id;
        const dbParticipants = participants.map((participant) => mongoose_1.Types.ObjectId.createFromHexString(participant));
        const users = await this._userModle.find({
            filter: {
                _id: {
                    $in: dbParticipants,
                },
                friends: {
                    $in: [createdBy],
                },
            },
        });
        if (users.length !== participants.length) {
            throw new global_error_handler_1.AppError("some users not found", 404);
        }
        const roomId = group?.replaceAll(/\s+/g, "-") + "_" + (0, zod_1.uuidv4)();
        if (req?.file) {
            groupImage = await this._s3Service.uploadFile({
                path: `chat/${roomId}`,
                file: req.file,
            });
        }
        dbParticipants.push(createdBy);
        const chat = await this._chatModel.create({
            group,
            groupImage,
            participants: dbParticipants,
            createdBy,
            roomId,
            messages: [],
        });
        if (!chat) {
            if (groupImage) {
                await this._s3Service.deleteFile(groupImage);
            }
            throw new global_error_handler_1.AppError("chat not created", 404);
        }
        return (0, response_success_1.successResponse)({
            res,
            status: 200,
            message: "success",
            data: chat,
        });
    };
    sendMessage = async (data, socket, io) => {
        const { sendTo, content } = data;
        const createdBy = socket.data.user._id;
        console.log({ sendTo, content, createdBy });
        const user = await this._userModle.findOne({ filter: { _id: sendTo } });
        if (!user) {
            throw new global_error_handler_1.AppError("user not found", 404);
        }
        const chat = await this._chatModel.findOneAndUpdate({
            filter: {
                participants: { $all: [sendTo, createdBy] },
                group: { $exists: false },
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy,
                    },
                },
            },
        });
        if (!chat) {
            await this._chatModel.create({
                createdBy,
                messages: [
                    {
                        content,
                        createdBy,
                    },
                ],
                participants: [createdBy, sendTo],
            });
        }
        io.to(await redis_service_1.default.getSockets(createdBy)).emit("successMessage", {
            content,
        });
        io.to(await redis_service_1.default.getSockets(sendTo)).emit("newMessage", {
            content,
            from: socket.data.user,
        });
    };
    sendGroupMessage = async (data, socket, io) => {
        const { content, groupId } = data;
        const createdBy = socket.data.user._id;
        const chat = await this._chatModel.findOneAndUpdate({
            filter: {
                _id: groupId,
                participants: { $in: [createdBy] },
                group: { $exists: true },
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy,
                    },
                },
            },
        });
        if (!chat) {
            throw new global_error_handler_1.AppError("chat not found", 404);
        }
        io.to(await redis_service_1.default.getSockets(createdBy)).emit("successMessage", {
            content,
        });
        socket
            .to(chat?.roomId)
            .emit("newMessage", { content, from: socket.data.user, groupId });
    };
    sayHi = async (data) => {
        console.log(data);
    };
    join_room = async (data, socket, io) => {
        console.log(data);
        const { roomId } = data;
        const chat = await this._chatModel.findOne({
            filter: {
                roomId,
                participants: { $in: [socket.data.user._id] },
                group: { $exists: true },
            },
        });
        if (!chat) {
            throw new global_error_handler_1.AppError("chat not found", 400);
        }
        socket.join(chat?.roomId);
    };
}
exports.default = new ChatService();
