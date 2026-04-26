import jwt, {
  Jwt,
  JwtPayload,
  PrivateKey,
  PublicKey,
  Secret,
  SignOptions,
  VerifyOptions,
} from "jsonwebtoken";

class TokenService {
  constructor() {}

  GenerateToken = ({
    payload,
    secretOrPrivateKey,
    options = {},
  }: {
    payload: string | Buffer | object;
    secretOrPrivateKey: Secret | PrivateKey;
    options?: SignOptions;
  }): string => {
    return jwt.sign(payload, secretOrPrivateKey, options);
  };

  VerifyToken = ({
    token,
    secretOrPublicKey,
    options = {},
  }: {
    token: string;
    secretOrPublicKey: Secret | PublicKey;
    options?: VerifyOptions;
  }): JwtPayload => {
    return jwt.verify(token, secretOrPublicKey, options) as JwtPayload;
  };
}

export default new TokenService();
