import * as z from "zod";
import { createCommentSchema } from "./comment.validation";

export type CreateCommentDto = z.infer<typeof createCommentSchema.body>;
