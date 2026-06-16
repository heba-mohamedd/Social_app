"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const config_service_1 = require("./config/config.service");
const global_error_handler_1 = require("./common/utils/global-error-handler");
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const connectionDB_1 = __importDefault(require("./DB/connectionDB"));
const redis_service_1 = __importDefault(require("./common/services/redis.service"));
const s3_service_1 = require("./common/services/s3.service");
const post_controller_1 = __importDefault(require("./modules/posts/post.controller"));
const express_2 = require("graphql-http/lib/use/express");
const graphql_schema_1 = require("./modules/graphql/graphql.schema");
const authentication_1 = require("./common/middleware/authentication");
const socket_gateway_1 = __importDefault(require("./modules/realtime/socket.gateway"));
const promises_1 = require("node:stream/promises");
const chat_controller_1 = __importDefault(require("./modules/chat/chat.controller"));
const app = (0, express_1.default)();
const port = Number(config_service_1.PORT);
const bootstrap = () => {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests from this IP, please try again later",
        legacyHeaders: false,
        handler: (req, res, next) => {
            throw new global_error_handler_1.AppError(`Too many requests from this IP, please try again later`, 429);
        },
    });
    app.use(express_1.default.json());
    app.use((0, helmet_1.default)(), (0, cors_1.default)(), limiter);
    app.get("/", (req, res, next) => res.json({ message: "wellcome in Social App" }));
    (0, connectionDB_1.default)();
    redis_service_1.default.connect();
    app.get("/general/*path", async (req, res, next) => {
        try {
            const { path } = req.params;
            const { downLoad } = req.query;
            const Key = path.join("/");
            const result = await new s3_service_1.S3Service().getFile(Key);
            const stream = result.Body;
            if (!stream) {
                throw new global_error_handler_1.AppError("File not found", 404);
            }
            res.setHeader("Content-Type", result.ContentType);
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
            if (downLoad && downLoad === "true") {
                res.setHeader("Content-Disposition", `attachment; filename="${path[path.length - 1]}"`);
            }
            await (0, promises_1.pipeline)(stream, res);
        }
        catch (error) {
            next(error);
        }
    });
    app.use("/auth", auth_controller_1.default);
    app.use("/posts", post_controller_1.default);
    app.use("/chat", chat_controller_1.default);
    app.use("/graphql", authentication_1.authentication, (0, express_2.createHandler)({ schema: graphql_schema_1.gql_schema, context: (req) => ({ req }) }));
    app.use("{/*demo}", (req, res, next) => {
        throw new global_error_handler_1.AppError(`URL ${req.originalUrl} Not Found ....`, 404);
    });
    app.use(global_error_handler_1.globalErrorHandler);
    const httpServer = app.listen(port, () => console.log(`Server is running on port ${port}`));
    socket_gateway_1.default.initIo(httpServer);
};
exports.default = bootstrap;
