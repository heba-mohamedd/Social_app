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
    app.use("/auth", auth_controller_1.default);
    app.use("{/*demo}", (req, res, next) => {
        throw new global_error_handler_1.AppError(`URL ${req.originalUrl} Not Found ....`, 404);
    });
    app.use(global_error_handler_1.globalErrorHandler);
    app.listen(port, () => console.log(`Server is running on port ${port}`));
};
exports.default = bootstrap;
