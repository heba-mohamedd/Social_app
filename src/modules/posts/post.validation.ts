import * as z from "zod";
import { generalRules } from "../../common/utils/generalRules";
import {
  Allow_Comment_Enum,
  Availability_Enum,
} from "../../common/enum/post.enum";

export const createPostSchema = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z.array(generalRules.file).optional(),
      tags: z.array(generalRules.id).optional(),
      allowComment: z
        .enum(Allow_Comment_Enum)
        .default(Allow_Comment_Enum.allow),
      availability: z.enum(Availability_Enum).default(Availability_Enum.public),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "content is required",
        });
      }
      if (args?.tags) {
        const uniqueTags = new Set(args.tags);
        if (args.tags.length !== uniqueTags.size) {
          ctx.addIssue({
            code: "custom",
            path: ["tags"],
            message: "Duplicate tags",
          });
        }
      }
    }),
};

export const likePostSchema = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
};

export const deletePostSchema = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
};
