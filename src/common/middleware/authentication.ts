import { NextFunction, Request, Response } from "express";
import redisService from "../services/redis.service.js";
import UserRepository from "../../DB/repositories/user.repository";
import tokenService from "../services/token.service";
import { AppError } from "../utils/global-error-handler";
import { ACCESS_SECRET_KEY_ADMIN, ACCESS_SECRET_KEY_USER, PREFIX_ADMIN, PREFIX_USER } from "../../config/config.service.js";

const _userModel = new UserRepository();

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new AppError("token not exist");
  }
  const [prefix, token]: string[] = authorization.split(" ");
  

  if (!token) {
    throw new AppError("token not found");
  }
  
  let ACCESS_SECRET_KEY: string = "";
  
  if(prefix == PREFIX_USER){
    ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_USER!;
  }else if (prefix == PREFIX_ADMIN){
    ACCESS_SECRET_KEY = ACCESS_SECRET_KEY_ADMIN!;
  }
  else {
    throw new AppError("inValid token Prefix")
  }

  const decoded = tokenService.VerifyToken({
    token: token,
    secretOrPublicKey: ACCESS_SECRET_KEY,
  });

  if (!decoded || !decoded?.id) {
    throw new AppError("inValid token");
  }

  const user = await _userModel.findOne({
    filter: {
      _id: decoded.id,
    },
  });
  if (!user) {
    throw new AppError("user not exist", 404);
  }
  if (
    user?.changeCredential &&
    user?.changeCredential?.getTime() > decoded.iat! * 1000
  ) {
    throw new AppError("inValid token");
  }

  const revokeToken = await redisService.getValue(
    redisService.revoked_key({ userId: user._id, jti: decoded.jti! }),
  );

  if (revokeToken) {
    throw new AppError("inValid token revoked");
  }
  req.user = user;
  req.decoded = decoded;
  next();
};
