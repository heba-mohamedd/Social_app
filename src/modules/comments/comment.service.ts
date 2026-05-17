import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/response.success";
import UserRepository from "../../DB/repositories/user.repository";
import RedisService from "../../common/services/redis.service";
import TokenService from "../../common/services/token.service";
import { S3Service } from "../../common/services/s3.service";
import NotificationService from "../../common/services/notification.service";
import { AppError } from "../../common/utils/global-error-handler";
import { HydratedDocument, Types } from "mongoose";
import PostRepository from "../../DB/repositories/post.repository";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import { Allow_Comment_Enum, On_Model_Enum } from "../../common/enum/post.enum";
import { CreateCommentDto } from "./comment.dto";
import CommentRepository from "../../DB/repositories/comment.repository";
import { AvailabilityPost } from "../../common/utils/post.utils";
import { IPost } from "../../DB/models/post.model";
import { IComment } from "../../DB/models/comment.model";

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
    const { content, tags, onModel }: CreateCommentDto = req.body;
    const { postId, commentId } = req.params;

    let doc: HydratedDocument<IPost | IComment> | null = null; // i can use this varibale to return the comment or the post

    if (onModel == On_Model_Enum.Post && !commentId) {
      doc = await this._postModle.findOne({
        filter: {
          _id: postId,
          deletedAt: { $exists: false },
          $or: [...AvailabilityPost(req)],
          allowComment: Allow_Comment_Enum.allow,
        },
      });
      if (!doc) {
        throw new AppError("post not found ", 404);
      }
    } else if (onModel == On_Model_Enum.Comment && commentId) {
      const commentDoc = await this._commentModle.findOne({
        filter: {
          _id: commentId,
          refId: postId!,
          onModel: On_Model_Enum.Post,
        },
        options: {
          populate: {
            // to make it sure that the comment is exist and its post is available and allow comment
            path: "refId", //return the post of the comment  as an object not just an id
            match: {
              $or: [...AvailabilityPost(req)],
              allowComment: Allow_Comment_Enum.allow,
            },
          },
        },
      });

      if (!commentDoc?.refId) {
        throw new AppError(
          "comment not found || comment deleted || comment not belong to this post || post is not available || post is deleted || post is private || post is blocked",
          404,
        );
      }
      doc = commentDoc;
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
        if (tag._id.toString() == req.user._id.toString()) {
          throw new AppError("you can't mention yourself");
        }
        mentions.push(tag._id);
        fcmTokens.push(...(await this._redisService.getFMCs(tag._id)));
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();

    if (req?.files) {
      urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${doc?.folderId}/comments/${folderId}`,
        store_type: Store_Enum.memory,
      });
    }

    const comment = await this._commentModle.create({
      attachments: urls,
      content: content || "",
      createBy: req?.user?._id,
      tags: mentions,
      folderId,
      refId: doc?._id!,
      onModel,
    });
    if (!comment) {
      await this._s3Service.deleteFiles(urls);
      throw new AppError("fail to create post", 500);
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

  // createReply = async (req: Request, res: Response, next: NextFunction) => {
  //   const { content, tags }: CreateReplyDto = req.body;
  //   const { postId, commentId } = req.params;

  //   const comment = await this._commentModle.findOne({
  //     filter: {
  //       _id: commentId,
  //       refId: postId!,
  //       onModel: On_Model_Enum.Post,
  //     },
  //     options: {
  //       populate: {
  //         // to make it sure that the comment is exist and its post is available and allow comment
  //         path: "refId", //return the post of the comment  as an object not just an id
  //         match: {
  //           $or: [...AvailabilityPost(req)],
  //           allowComment: Allow_Comment_Enum.allow,
  //         },
  //       },
  //     },
  //   });

  //   if (!comment?.refId) {
  //     throw new AppError(
  //       "comment not found || comment deleted || comment not belong to this post || post is not available || post is deleted || post is private || post is blocked",
  //       404,
  //     );
  //   }

  //   let mentions: Types.ObjectId[] = [];
  //   let fcmTokens: string[] = [];
  //   if (tags?.length) {
  //     const mentionsTage = await this._userModle.find({
  //       filter: { _id: { $in: tags } },
  //     });
  //     if (mentionsTage.length != tags?.length) {
  //       throw new AppError("invalid tag id");
  //     }
  //     for (const tag of mentionsTage) {
  //       if (tag._id.toString() == req.user._id.toString()) {
  //         throw new AppError("you can't mention yourself");
  //       }
  //       mentions.push(tag._id);
  //       fcmTokens.push(...(await this._redisService.getFMCs(tag._id)));
  //     }
  //   }

  //   let urls: string[] = [];
  //   let folderId = randomUUID();

  //   if (req?.files) {
  //     urls = await this._s3Service.uploadFiles({
  //       files: req.files as Express.Multer.File[],
  //       path: `users/${req?.user?._id}/posts/${(comment.refId as any).folderId}/comments/${folderId}`,
  //       store_type: Store_Enum.memory,
  //     });
  //   }

  //   const reply = await this._commentModle.create({
  //     attachments: urls,
  //     content: content || "",
  //     createBy: req?.user?._id,
  //     tags: mentions,
  //     folderId,
  //     postId: comment.postId._id,
  //     commentId: comment._id,
  //   });
  //   if (!reply) {
  //     await this._s3Service.deleteFiles(urls);
  //     throw new AppError("fail to create post", 500);
  //   }
  //   if (fcmTokens?.length) {
  //     await this._notificationService.sendNotifications({
  //       tokens: fcmTokens,
  //       notification: {
  //         title: "You were mentioned in a comment",
  //         body: content || "New comment",
  //       },
  //     });
  //   }

  //   successResponse({ res, data: reply });
  // };
}

export default new PostServise();
