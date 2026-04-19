import { get, revoked_key } from "../../DB/redis/redis.service.js";
import { NextFunction, Request, Response } from "express";
import UserRepository from "../../DB/repositories/user.repository.js";
import { ACCESS_SECRET_KEY, PREFIX } from "../../config/config.service.js";
import { VerifyToken } from "../utils/token.service.js";
import { AppError } from "../utils/global-error-handler.js";
import { UserDocument } from "../../DB/models/user.model.js";



export interface ITokenPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface IRequest extends Request {
  user?: UserDocument;
  decoded?: ITokenPayload;
}
export const authentication = async (req:IRequest, res:Response, next:NextFunction) => {
  const userRepository = new UserRepository();
  const { authentication } = req.headers;

  if (!authentication || typeof authentication !== "string") {
    throw new AppError("Invalid authorization header", 401);
}
const [prefix, token] = authentication.split(" ") || [];

if (!prefix || !token) {
  throw new AppError("Invalid authorization format", 401);
}  if (prefix !== PREFIX) {
    throw new AppError("inValid token Prefix", 401);
  }

  const decoded = VerifyToken({
    token: token,
    secretOrPublicKey: ACCESS_SECRET_KEY!,
  }) as ITokenPayload;

  if (!decoded || !decoded?.id) {
    throw new AppError("inValid token", 401);
  }

  const user = await userRepository.findOne({
    filter: {
      _id: decoded.id,
    },
  });
  if (!user) {
    throw new AppError("user not exist", 404);
  }
  if (user.changeCredential && user.changeCredential.getTime() > decoded.iat * 1000) {
    throw new AppError("inValid token", 401);
  }
  const revokeToken = await get(
    revoked_key({ userId: user._id.toString(), jti: decoded.jti }),
  );

  if (revokeToken) {
    throw new AppError("inValid token revoked", 401);
  }
  req.user = user;
  req.decoded = decoded;
  next();
};

// decoded >>>payload {
//   "id": "69ad8bf93c7f1e277f749a28",
//   "email": "heba111@gmail.com",
//   "iat": 1773243739,
//   "exp": 1773247339,
//   "jti": "9d8026b8-3970-47e9-97b7-f72be8d64a30"
// }
