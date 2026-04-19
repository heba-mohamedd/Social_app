import * as z from "zod";
import { GenderEnum } from "../../common/enum/user.enum";

export const signUpSchema = {
  body: z
    .object({
      userName: z.string({ error: "userName is Required" }).min(3).max(25),
      email: z.string().email(),
      password: z.string().min(6),
      cPassword: z.string().min(6),
      age: z.coerce.number().min(15).max(60),
      gender: z.nativeEnum(GenderEnum).optional(),
      address: z.string().optional(),
      phone: z.string().min(11).max(11).optional(),
    })
    .refine((data) => data.password === data.cPassword, {
      message: "Passwords do not match",
      path: ["cPassword"],
    }),
};

export const signInSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
};

export const confirmEmailSchema = {
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  }),
};
export const updataPasswordSchema = {
  body: z
    .object({
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
  body: z.object({
    email: z.string().email(),
  }),
};

export const resetPasswordSchema = {
  body: z
    .object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
      password: z.string().min(6),
    })
    .required(),
};
