import * as z from "zod";
import { createPostSchema } from "./post.validation";

export type CreatePostDto = z.infer<typeof createPostSchema.body>;
