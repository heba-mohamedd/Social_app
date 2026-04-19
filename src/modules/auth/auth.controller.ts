import { Router } from "express";
import authService from "./auth.service";
import { Validation } from "../../common/middleware/validation";
import {
  confirmEmailSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updataPasswordSchema,
} from "./auth.validation";
import { authorization } from "../../common/middleware/authorization";
import { authentication } from "../../common/middleware/authentication";
import { RoleEnum } from "../../common/enum/user.enum";
const authRouter = Router();

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
  "/forget-password",
  Validation(forgetPasswordSchema),
  authService.forgetPassword,
);
authRouter.patch(
  "/reset-password",
  Validation(resetPasswordSchema),
  authService.resetPassword,
);

authRouter.get("/logout", authentication, authService.logout);

export default authRouter;
