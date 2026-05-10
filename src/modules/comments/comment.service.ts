import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/response.success";
import UserRepository from "../../DB/repositories/user.repository";
import RedisService from "../../common/services/redis.service";
import TokenService from "../../common/services/token.service";
import { S3Service } from "../../common/services/s3.service";
import NotificationService from "../../common/services/notification.service";
import { AppError } from "../../common/utils/global-error-handler";
import { Types } from "mongoose";
import PostRepository from "../../DB/repositories/post.repository";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import { Allow_Comment_Enum } from "../../common/enum/post.enum";
import { CreateCommentDto } from "./comment.dto";
import CommentRepository from "../../DB/repositories/comment.repository";
import { PostAvailability } from "../../common/utils/post.utils";

class PostServise {
  private readonly _userModle = new UserRepository();
  private readonly _postModle = new PostRepository();
  private readonly _commentModle = new CommentRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = RedisService;
  private readonly _tokenService = TokenService;
  private readonly _notificationService = NotificationService;
  constructor() {}
  createcomment = async (req: Request, res: Response, next: NextFunction) => {
    const { content, attachments, tags }: CreateCommentDto = req.body;
    const { postId } = req.params;

    const post = await this._postModle.findOne({
      filter: {
        _id: postId,
        $or: [...PostAvailability(req)],
        allowComment: Allow_Comment_Enum.allow,
      },
    });
    if (!post) {
      throw new AppError("post not found");
    }

    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];
    if (tags?.length) {
      const mentionsTage = await this._userModle.find({
        filter: { _id: { $in: tags } },
      });
      if (mentionsTage.length != tags?.length) {
        throw new AppError("invalid tag id");
      }
      for (const tag of mentionsTage) {
        mentions.push(tag._id);
        fcmTokens.push(...(await this._redisService.getFMCs(tag._id)));
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();

    if (req?.files) {
      urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${folderId}/comments/${folderId}`,
        store_type: Store_Enum.memory,
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
      throw new AppError("fail to create post");
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

    successResponse({ res, data: comment });
  };
}

export default new PostServise();
