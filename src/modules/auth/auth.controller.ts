import { Router } from "express";
import authService from "./auth.service";
import { Validation } from "../../common/middleware/validation";
import {
  confirmEmailSchema,
  forgetPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updataPasswordSchema,
} from "./auth.validation";
import { authorization } from "../../common/middleware/authorization";
import { authentication } from "../../common/middleware/authentication";
import { RoleEnum } from "../../common/enum/user.enum";
import multerCloud from "../../common/middleware/multer.cloud";
import { Store_Enum } from "../../common/enum/multer.enum";
import chatRouter from "../chat/chat.controller";
const authRouter = Router();
authRouter.use("/:userId/chat", chatRouter);

authRouter.post("/signup", Validation(signUpSchema), authService.signUp);
authRouter.patch(
  "/confirm-email",
  Validation(confirmEmailSchema),
  authService.confirmEmail,
);

authRouter.post("/signin", Validation(signInSchema), authService.signIn);
authRouter.post("/signup/gmail", authService.signUpWithGmail);

authRouter.patch(
  "/updata-password",
  authentication,
  authorization([RoleEnum.user]),
  Validation(updataPasswordSchema),
  authService.updatatPassword,
);

authRouter.patch(
  "/resend-otp",
  Validation(resendOtpSchema),
  authService.resendOtp,
);

authRouter.patch(
  "/forget-password",
  Validation(forgetPasswordSchema),
  authService.forgetPassword,
);
authRouter.patch(
  "/reset-password",
  Validation(resetPasswordSchema),
  authService.resetPassword,
);
authRouter.get(
  "/profile",
  authentication,
  authorization([RoleEnum.user]),
  authService.getProfile,
);

authRouter.get("/logout", authentication, authService.logout);

authRouter.post(
  "/upload",
  authentication,
  multerCloud().single("attachment"),
  authService.uploadProfileImage,
);
// authRouter.post(
//   "/upload",
//   authentication,
//   // multerCloud({ store_type: Store_Enum.memory }).array("attachment"),
//   authService.uploadImage,
// );

export default authRouter;
