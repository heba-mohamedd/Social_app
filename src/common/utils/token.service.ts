import jwt from "jsonwebtoken";

export const GenerateToken = ({
  payload,
  secretOrPrivateKey,
  options = {},
}: {
  payload: string | object | Buffer<ArrayBufferLike>;
  secretOrPrivateKey: jwt.Secret | jwt.PrivateKey;
  options?: jwt.SignOptions;
}) => {
  return jwt.sign(payload, secretOrPrivateKey, options);
};

export const VerifyToken = ({
  token,
  secretOrPublicKey,
  options = {},
}: {
  token: string;
  secretOrPublicKey: jwt.Secret | jwt.PublicKey;
  options?: jwt.VerifyOptions;
}) => {
  return jwt.verify(token, secretOrPublicKey, options);
};