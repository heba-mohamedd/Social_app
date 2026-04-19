import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/global-error-handler";

interface AuthRequest extends Request {
  user?: {
    role: string;
  };
}
export const authorization = (roles: string[] = []) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("UnAuthorized", 403);
    }

    next();
  };
};
