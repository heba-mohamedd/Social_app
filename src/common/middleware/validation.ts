import { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/utils/global-error-handler";
import { ZodType } from "zod";
import { GraphQLError } from "graphql";

type reqType = keyof Request;
type schemaType = Partial<Record<reqType, ZodType>>;

export const Validation = (schema: schemaType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validationError = [];

    // Ensure req.body is always an object (can be undefined in PUT/PATCH multipart requests)
    if (!req.body) req.body = {};

    // Inject multer files into req.body BEFORE validation so schema can see them
    if (req?.file) {
      req.body.attachment = req.file;
    }
    if (req?.files) {
      req.body.attachments = req.files;
    }

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

export const Validation_GQL = async (schema: ZodType, data: any) => {
  const validationError = [];

  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    const errors = result.error.issues.map((err: any) => {
      return {
        path: err.path[0],
        message: err.message,
      };
    });
    validationError.push(...errors);
  }

  if (validationError.length > 0) {
    throw new GraphQLError("validation failed", {
      extensions: {
        code: "BAD_REQUEST",
        status: 400,
        message: validationError,
      },
    });
  }
};
