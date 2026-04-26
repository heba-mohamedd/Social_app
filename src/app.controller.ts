import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { PORT } from "./config/config.service";
import {
  AppError,
  globalErrorHandler,
} from "./common/utils/global-error-handler";
import authRouter from "./modules/auth/auth.controller";
import checkConnectionDB from "./DB/connectionDB";
import redisService from "./common/services/redis.service";

const app: express.Application = express();
const port: number = Number(PORT);

const bootstrap = () => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later",
    legacyHeaders: false,

    handler: (req: Request, res: Response, next: NextFunction) => {
      // res.status(429).json({ success: false,message: "Too many requests from this IP, please try again later"})},
      throw new AppError(
        `Too many requests from this IP, please try again later`,
        429,
      );
    },
  });

  app.use(express.json());
  app.use(helmet(), cors(), limiter);
  app.get("/", (req: Request, res: Response, next: NextFunction) =>
    res.json({ message: "wellcome in Social App" }),
  );
  checkConnectionDB();
  redisService.connect();

  app.use("/auth", authRouter);
  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(`URL ${req.originalUrl} Not Found ....`, 404);
    // throw new Error(`URL ${req.originalUrl} Not Found ....`, { cause: 404 });
  });

  app.use(globalErrorHandler);

  app.listen(port, () => console.log(`Server is running on port ${port}`));
};

export default bootstrap;
