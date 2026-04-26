import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";

export const authorization = (roles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as string)) {
      throw new AppError("UnAuthorized", 403);
    }

    next();
  };
};
