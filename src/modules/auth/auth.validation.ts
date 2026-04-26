import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";

export const signInSchema = {
  body: z.strictObject({
    email: z.email("inValid email address"),
    password: z.string().min(6),
  }),
};
export const signUpSchema = {
  body: signInSchema.body
    .safeExtend({
      userName: z
        .string({ error: "userName is Required" })
        .min(3, "userName must be 3 or more characters")
        .max(25),

      cPassword: z.string().min(6),
      age: z.coerce.number().min(15, "age must be 15 or more ").max(60),
      gender: z.enum(GenderEnum).optional(),
      address: z.string().optional(),
      phone: z.string().min(11).max(11).optional(),
    })
    .refine((data) => data.password === data.cPassword, {
      message: "Passwords do not match",
      path: ["cPassword"],
    }),
};

export const confirmEmailSchema = {
  body: z.strictObject({
    email: z.email("inValid email address"),
    code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  }),
};
export const updataPasswordSchema = {
  body: z
    .strictObject({
      newPassword: z.string().min(6),
      cPassword: z.string(),
      oldPassword: z.string().min(6),
    })
    .refine((data) => data.newPassword === data.cPassword, {
      message: "Passwords do not match",
      path: ["cPassword"],
    }),
};

export const forgetPasswordSchema = {
  body: z.strictObject({
    email: z.email("inValid email address"),
  }),
};

export const resetPasswordSchema = {
  body: z.strictObject({
    email: z.email("inValid email address"),
    code: z.string().regex(/^\d{6}$/),
    password: z.string().min(6),
  }),
};

export const resendOtpSchema = {
  body: z.strictObject({
    email: z.email("inValid email address"),
  }),
};
