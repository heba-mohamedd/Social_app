"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const post_enum_1 = require("../../common/enum/post.enum");
const comment_model_1 = __importDefault(require("./comment.model"));
const PostSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        min: 1,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    createBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    allowComment: {
        type: String,
        enum: post_enum_1.Allow_Comment_Enum,
        default: post_enum_1.Allow_Comment_Enum.allow,
    },
    availability: {
        type: String,
        enum: post_enum_1.Availability_Enum,
        default: post_enum_1.Availability_Enum.public,
    },
    folderId: String,
    deletedAt: Date,
}, {
    timestamps: true,
    strictQuery: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
function excludeDeleted() {
    const query = this.getQuery();
    if (!query.deletedAt) {
        this.where({ deletedAt: { $exists: false } });
    }
}
PostSchema.pre("find", excludeDeleted);
PostSchema.pre("findOne", excludeDeleted);
PostSchema.pre("findOneAndUpdate", excludeDeleted);
PostSchema.post("findOneAndUpdate", async function (doc) {
    if (doc?.deletedAt) {
        await comment_model_1.default.updateMany({
            postId: doc._id,
        }, {
            deletedAt: new Date(),
        });
    }
});
PostSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "refId",
    match: {
        onModel: post_enum_1.On_Model_Enum.Post,
    },
});
const PostModel = mongoose_1.default.models.Post || mongoose_1.default.model("Post", PostSchema);
exports.default = PostModel;
