import * as z from "zod";
import { createCommentSchema } from "./comment.validation";

export type CreateCommentDto = z.infer<typeof createCommentSchema.body>;
// export type CreateReplyDto = z.infer<typeof createReplySchema.body>;
