import { Router } from "express";
import { Validation } from "../../common/middleware/validation";
import * as commentValidation from "./comment.validation";
import { authentication } from "../../common/middleware/authentication";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import commentService from "./comment.service";
const commentRouter = Router({ mergeParams: true });

commentRouter.post(
  "/",
  authentication,
  multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
  Validation(commentValidation.createCommentSchema),
  commentService.createcomment,
);

// commentRouter.post(
//   "/:commentId/replies",
//   authentication,
//   multerCloud({ store_type: Store_Enum.memory }).array("attachments"),
//   Validation(commentValidation.createReplySchema),
//   commentService.createReply,
// );
// commentRouter.get("/get-comment", authentication, commentService.getcomments);

export default commentRouter;
