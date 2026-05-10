"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_repository_1 = __importDefault(require("./base.repository"));
const user_model_1 = __importDefault(require("../models/user.model"));
const global_error_handler_1 = require("../../common/utils/global-error-handler");
class UserRepository extends base_repository_1.default {
    model;
    constructor(model = user_model_1.default) {
        super(model);
        this.model = model;
    }
    async checkUserAccount(email) {
        const user = await this.findOne({ filter: { email } });
        if (user) {
            throw new global_error_handler_1.AppError("email already exist", 409);
        }
        return user;
    }
}
exports.default = UserRepository;
