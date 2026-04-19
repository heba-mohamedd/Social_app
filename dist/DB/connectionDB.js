"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_service_1 = require("../config/config.service");
const checkConnectionDB = async () => {
    await mongoose_1.default
        .connect(config_service_1.MONGO_DB, {
        serverSelectionTimeoutMS: 5000,
    })
        .then(() => {
        console.log("DataBase connected Successfully");
    })
        .catch((error) => {
        console.log(error, "DB fail to connected ...");
    });
};
exports.default = checkConnectionDB;
