"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multer_enum_1 = require("../enum/multer.enum");
const node_os_1 = require("node:os");
const multerCloud = ({ store_type = multer_enum_1.Store_Enum.memory, custom_types = multer_enum_1.multer_enum.image, maxFileSize = 5 * 1024 * 1024, } = {}) => {
    const storage = store_type === multer_enum_1.Store_Enum.memory
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: (0, node_os_1.tmpdir)(),
            filename: function (req, file, callback) {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                callback(null, file.fieldname + "-" + uniqueSuffix + ".png");
            },
        });
    function fileFilter(req, file, callback) {
        if (!custom_types.includes(file.mimetype)) {
            callback(new Error("Invalid File type"));
        }
        callback(null, true);
    }
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: { fileSize: maxFileSize },
    });
    return upload;
};
exports.default = multerCloud;
