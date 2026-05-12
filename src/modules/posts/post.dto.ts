import * as z from "zod";
import { createPostSchema, updataPostSchema } from "./post.validation";

export type CreatePostDto = z.infer<typeof createPostSchema.body>;
export type UpdataPostDto = z.infer<typeof updataPostSchema.body>;
export type PostIdDto = z.infer<typeof updataPostSchema.params>;
