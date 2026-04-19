import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utils/global-error-handler";
import { ZodType } from "zod";

type reqType = keyof Request;
type schemaType = Partial<Record<reqType, ZodType>>;

export const Validation = (schema: schemaType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validationError = [];

    for (const key of Object.keys(schema) as reqType[]) {
      if (!schema[key]) continue;
      const result = await schema[key].safeParseAsync(req[key]);

      if (!result.success) {
        validationError.push(JSON.parse(result.error.message));
      }
    }

    if (validationError.length > 0) {
      return next(new AppError(validationError, 400));
    }

    next();
  };
};
