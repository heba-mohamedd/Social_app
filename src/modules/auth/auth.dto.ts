import * as z from "zod";
import { signUpSchema } from "./auth.validation";

export type ISignUpType = z.infer<typeof signUpSchema.body>;
