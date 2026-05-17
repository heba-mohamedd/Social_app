import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/response.success";
import UserRepository from "../../DB/repositories/user.repository";
import RedisService from "../../common/services/redis.service";
import TokenService from "../../common/services/token.service";
import { S3Service } from "../../common/services/s3.service";
import NotificationService from "../../common/services/notification.service";
import { CreatePostDto, PostIdDto, UpdataPostDto } from "./post.dto";
import { AppError } from "../../common/utils/global-error-handler";
import { Types } from "mongoose";
import PostRepository from "../../DB/repositories/post.repository";
import { randomUUID } from "node:crypto";
import { Store_Enum } from "../../common/enum/multer.enum";
import { AvailabilityPost } from "../../common/utils/post.utils";
import { Like_DisLike_Enum } from "../../common/enum/post.enum";

class PostServise {
  private readonly _userModle = new UserRepository();
  private readonly _postModle = new PostRepository();
  private readonly _s3Service = new S3Service();
  private readonly _redisService = RedisService;
  private readonly _tokenService = TokenService;
  private readonly _notificationService = NotificationService;
  constructor() {}
  createPost = async (req: Request, res: Response, next: NextFunction) => {
    const { content, allowComment, availability, tags }: CreatePostDto =
      req.body;
    let mentions: Types.ObjectId[] = [];
    let fcmTokens: string[] = [];

    // Only validate tags if tags were actually provided
    if (tags?.length) {
      const mentionsTage = await this._userModle.find({
        filter: { _id: { $in: tags } },
      });
      if (mentionsTage.length !== tags.length) {
        throw new AppError("some of tag id you want mention is invalid");
      }
      for (const tag of mentionsTage) {
        if (tag._id.toString() == req.user._id.toString()) {
          throw new AppError("you can't mention yourself");
        }
        mentions.push(tag._id);
        (await this._redisService.getFMCs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }

    let urls: string[] = [];
    let folderId = randomUUID();

    if (req?.files) {
      urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${folderId}`,
        store_type: Store_Enum.memory,
      });
    }

    const post = await this._postModle.create({
      attachments: urls,
      content: content!,
      createBy: req?.user?._id,
      tags: mentions,
      availability,
      allowComment,
      folderId,
    });
    if (!post) {
      await this._s3Service.deleteFiles(urls);
      throw new AppError("fail to create post");
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

    successResponse({ res, data: post });
  };

  updataPost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params as PostIdDto;

    const {
      content,
      allowComment,
      availability,
      tags,
      removeTags,
      removeFiles,
    }: UpdataPostDto = req.body;
    let fcmTokens: string[] = [];

    let post = await this._postModle.findOne({
      filter: {
        _id: postId,
        createBy: req.user._id,
      },
    });

    if (!post) {
      throw new AppError("post not Found", 404);
    }

    if (removeFiles?.length) {
      let inValidFiles = removeFiles.filter((file: string) => {
        return !post.attachments?.includes(file);
      });
      if (inValidFiles?.length) {
        throw new AppError("some of path file you want remove not exist");
      }
      await this._s3Service.deleteFiles(removeFiles);
      post.attachments = post.attachments?.filter((file: string) => {
        return !removeFiles.includes(file);
      }) as string[];
    }

    let updataTags = new Set(post?.tags?.map((id) => id.toString()));
    removeTags?.forEach((tag: string) => {
      updataTags.delete(tag);
    });

    // Only validate tags if tags were actually provided
    if (tags?.length) {
      const mentionsTage = await this._userModle.find({
        filter: { _id: { $in: tags } },
      });
      if (mentionsTage.length !== tags.length) {
        throw new AppError("some of tag id you want mention is invalid");
      }
      for (const tag of mentionsTage) {
        if (tag._id.toString() == req.user._id.toString()) {
          throw new AppError("you can't mention yourself");
        }
        updataTags.add(tag._id.toString());
        (await this._redisService.getFMCs(tag._id)).map((token) =>
          fcmTokens.push(token),
        );
      }
    }
    post.tags = [...updataTags].map((id: string) => new Types.ObjectId(id));

    if (req.files?.length) {
      let urls = await this._s3Service.uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${post.folderId}`,
        store_type: Store_Enum.memory,
      });

      post.attachments?.push(...urls);
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
    if (content) post.content = content;
    if (availability) post.availability = availability;
    if (allowComment) post.allowComment = allowComment;

    await post.save();

    successResponse({ res, data: post });
  };

  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    const searchQuery = req?.query?.search
      ? { content: { $regex: req.query.search, $options: "i" } }
      : {};
    const posts = await this._postModle.paginate({
      page: Number(req?.query?.page),
      limit: Number(req?.query?.limit),
      sort: { createdAt: -1 },
      search: {
        $or: [...AvailabilityPost(req)],
        deletedAt: { $exists: false },
        ...searchQuery,
      },
    });

    successResponse({ res, data: posts });
  };

  likePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    const { flag } = req.query;

    let updataQuery: any = {
      $addToSet: {
        likes: req.user._id,
      },
    };
    if (flag && flag == Like_DisLike_Enum.disLike) {
      updataQuery = {
        $pull: {
          likes: req.user._id,
        },
      };
    }
    const post = await this._postModle.findOneAndUpdate({
      filter: {
        _id: postId,
        deletedAt: { $exists: false },
        $or: [...AvailabilityPost(req)],
      },
      update: updataQuery,
      options: {
        new: true,
      },
    });
    if (!post) {
      throw new AppError("post not found or not authorized", 404);
    }
    successResponse({ res, data: post });
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;

    const post = await this._postModle.findOneAndUpdate({
      filter: {
        _id: postId,
        createBy: req.user._id, // only the owner can delete
        deletedAt: { $exists: false }, // not already deleted
      },
      update: { deletedAt: new Date() },
    });
    if (!post) {
      throw new AppError("post not found or not authorized", 404);
    }

    successResponse({ res, message: "post deleted successfully" });
  };
}

export default new PostServise();
