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
import { S3Service } from "./common/services/s3.service";
import { successResponse } from "./common/utils/response.success";
import notificationService from "./common/services/notification.service";
import postRouter from "./modules/posts/post.controller";
import commentRouter from "./modules/comments/comment.controller";
import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import { createHandler } from "graphql-http/lib/use/express";
import { gql_schema } from "./modules/graphql/graphql.schema";
import { authentication } from "./common/middleware/authentication";
// import { S3Service } from "./common/services/s3.service";
// import { pipeline } from "node:stream/promises";
// import { successResponse } from "./common/utils/response.success";

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

  // app.post(
  //   "/send-notification",
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const result = await notificationService.sendNotification({
  //       token: req.body.token,
  //       notification: { title: "hiii", body: "Heba Mohamed" },
  //     });

  //     successResponse({ res, data: result });
  //   },
  // );
  checkConnectionDB();
  redisService.connect();

  // app.get(
  //   "/general",
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     // const { Key } = req.query as { Key: string };
  //     // const {keys} = req.body;
  //     const { folderName } = req.query as { folderName: string };

  //     // const result = await new S3Service().deleteFiles(keys);
  //     const result = await new S3Service().deleteFolder(folderName);

  //     successResponse({ res, data: result });
  //   },
  // );
  // app.get(
  //   "/general",
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const { folderName } = req.query as { folderName: string };

  //     const result = await new S3Service().getFiles(folderName);
  //     const resultMapped = result.Contents?.map((file) => {
  //       return { key: file.Key };
  //     });
  //     successResponse({ res, data: resultMapped });
  //   },
  // );
  // app.get(
  //   "/general/pre-signed/*path",
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const { path } = req.params as { path: string[] };
  //     const { download } = req.query as { download: string };
  //     const Key = path.join("/") as string;

  //     const url = await new S3Service().getPreSignedUrl({
  //       Key,
  //       download: download ? download : undefined,
  //     });

  //     successResponse({ res, data: url });
  //   },
  // );

  // app.get(
  //   "/general/*path",
  //   async (req: Request, res: Response, next: NextFunction) => {
  //     const { path } = req.params as { path: string[] };
  //     const { downLoad } = req.query;
  //     const Key = path.join("/") as string;

  //     const result = await new S3Service().getFile(Key);
  //     //  const {Body} = result;
  //     const stream = result.Body as NodeJS.ReadableStream;
  //     //  if (!Body) {
  //     //   throw new AppError("File not found", 404);
  //     //  }
  //     res.setHeader("Content-Type", result.ContentType as string);
  //     res.set("Cross-Origin-Resource-Policy", "cross-origin");
  //     if (downLoad && downLoad === "true") {
  //       res.setHeader(
  //         "Content-Disposition",
  //         `attachment; filename="${path.pop()}"`,
  //       ); // only apply it for  download
  //     }

  //     await pipeline(stream, res);

  //     // successResponse({ res, data: Key });
  //   },
  // );

  app.use("/auth", authRouter);
  app.use("/posts", postRouter);

  app.use(
    "/graphql",
    authentication,
    createHandler({ schema: gql_schema, context: (req) => ({ req }) }),
  ); // the endpoint for the graphql
  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(`URL ${req.originalUrl} Not Found ....`, 404);
    // throw new Error(`URL ${req.originalUrl} Not Found ....`, { cause: 404 });
  });

  app.use(globalErrorHandler);

  app.listen(port, () => console.log(`Server is running on port ${port}`));
};

export default bootstrap;
