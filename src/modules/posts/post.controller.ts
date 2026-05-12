import { Router } from "express";
import { Validation } from "../../common/middleware/validation";
import * as postValidation from "./post.validation";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import postService from "./post.service";
const postRouter = Router();

postRouter.post(
  "/create-post",
  authentication,
  multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
  Validation(postValidation.createPostSchema),
  postService.createPost,
);

postRouter.put(
  "/updata/:postId",
  authentication,
  multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
  Validation(postValidation.updataPostSchema),
  postService.updataPost,
);

postRouter.get("/get-post", authentication, postService.getPosts);

postRouter.patch(
  "/:postId",
  authentication,
  Validation(postValidation.likePostSchema),
  postService.likePost,
);
postRouter.delete("/:postId", authentication, postService.deletePost);

export default postRouter;
