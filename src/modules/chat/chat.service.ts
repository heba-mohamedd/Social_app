import { NextFunction, Request, Response } from "express";
import ChatModel from "../../DB/models/chat.model";
import ChatRepository from "../../DB/repositories/chat.repository";
import { AppError } from "../../common/utils/global-error-handler";
import { successResponse } from "../../common/utils/response.success";
import { Server, Socket } from "socket.io";
import UserRepository from "../../DB/repositories/user.repository";
import redisService from "../../common/services/redis.service";
import { Types } from "mongoose";
import { uuidv4 } from "zod";
import { S3Service } from "../../common/services/s3.service";

class ChatService {
  private readonly _chatModel = new ChatRepository();
  private readonly _userModle = new UserRepository();
  private readonly _s3Service = new S3Service();

  constructor() {}

  //rest apis
  getChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    let { limit, page = 1 } = req.query as unknown as {
      limit: number;
      page: number;
    };
    if (page < 0) page = 1;
    page = page * 1 || 1;
    limit = limit * 1 || 5;

    const chat = await this._chatModel.findOne({
      filter: {
        participants: {
          $all: [req.user?._id!, userId],
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

    // return res.status(200).json({ message: "Done", chat });
    successResponse({ res, message: "Done", data: { chat } });
  };

  getGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    const { groupId } = req.params;
    let { limit, page = 1 } = req.query as unknown as {
      limit: number;
      page: number;
    };
    if (page < 0) page = 1;
    page = page * 1 || 1;
    limit = limit * 1 || 5;

    const chat = await this._chatModel.findOne({
      filter: {
        _id: groupId,
        participants: {
          $in: [req.user?._id!],
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
      throw new AppError("chat not found", 404);
    }
    // return res.status(200).json({ message: "success", chat });
    successResponse({ res, message: "Done", data: { chat } });
  };

  createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    let { group, groupImage, participants } = req.body;
    const createdBy = req.user?._id as Types.ObjectId;
    const dbParticipants = participants.map((participant: string) =>
      Types.ObjectId.createFromHexString(participant),
    );

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
      throw new AppError("some users not found", 404);
    }
    const roomId = group?.replaceAll(/\s+/g, "-") + "_" + uuidv4();
    if (req?.file) {
      groupImage = await this._s3Service.uploadFile({
        path: `chat/${roomId}`,
        file: req.file as Express.Multer.File,
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
      throw new AppError("chat not created", 404);
    }

    return successResponse({
      res,
      status: 200,
      message: "success",
      data: chat,
    });
  };

  //socket.io
  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { sendTo, content } = data;
    const createdBy = socket.data.user._id;
    console.log({ sendTo, content, createdBy });

    const user = await this._userModle.findOne({ filter: { _id: sendTo } });
    if (!user) {
      throw new AppError("user not found", 404);
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
    io.to(await redisService.getSockets(createdBy)).emit("successMessage", {
      content,
    });
    io.to(await redisService.getSockets(sendTo)).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
  sendGroupMessage = async (data: any, socket: Socket, io: Server) => {
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
      throw new AppError("chat not found", 404);
    }
    io.to(await redisService.getSockets(createdBy)).emit("successMessage", {
      content,
    });
    socket
      .to(chat?.roomId!)
      .emit("newMessage", { content, from: socket.data.user, groupId });
  };

  sayHi = async (data: any) => {
    console.log(data);
  };
  join_room = async (data: any, socket: Socket, io: Server) => {
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
      throw new AppError("chat not found", 400);
    }
    socket.join(chat?.roomId!);
  };
}

export default new ChatService();
