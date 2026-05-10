import * as z from "zod";
import { generalRules } from "../../common/utils/generalRules";

export const createCommentSchema = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z.array(generalRules.file).optional(),
      tags: z.array(generalRules.id).optional(),
    })
    .superRefine((args, ctx) => {
      if (!args.content && !args.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "content is required",
        });
      }

      if (args.tags) {
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

  params: z.strictObject({
    postId: generalRules.id,
  }),
};
