import * as z from "zod";
import {
  confirmEmailSchema,
  forgetPasswordSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./auth.validation";

export type SignUpDto = z.infer<typeof signUpSchema.body>;
export type confirmEmailDto = z.infer<typeof confirmEmailSchema.body>;
export type SignInDto = z.infer<typeof signInSchema.body>;
export type resendOtpDTO = z.infer<typeof resendOtpSchema.body>;
export type forgetPasswordDto = z.infer<typeof forgetPasswordSchema.body>;
export type resetPasswordDto = z.infer<typeof resetPasswordSchema.body>;
