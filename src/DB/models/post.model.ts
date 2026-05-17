import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  Allow_Comment_Enum,
  Availability_Enum,
  On_Model_Enum,
} from "../../common/enum/post.enum";
import CommentModel from "./comment.model";

export interface IPost {
  content?: string;
  attachments?: string[];
  createBy: Types.ObjectId;

  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];

  allowComment?: Allow_Comment_Enum;
  availability?: Availability_Enum;

  folderId: string;
  deletedAt?: Date;
}

const PostSchema = new mongoose.Schema<IPost>(
  {
    content: {
      type: String,
      min: 1,
      required: function (this) {
        return !this.attachments?.length;
      },
    },

    attachments: [String],
    createBy: { type: Types.ObjectId, ref: "User", required: true },

    tags: [{ type: Types.ObjectId, ref: "User" }],
    likes: [{ type: Types.ObjectId, ref: "User" }],

    allowComment: {
      type: String,
      enum: Allow_Comment_Enum,
      default: Allow_Comment_Enum.allow,
    },
    availability: {
      type: String,
      enum: Availability_Enum,
      default: Availability_Enum.public,
    },
    folderId: String,
    deletedAt: Date,
  },
  {
    timestamps: true,
    strictQuery: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

function excludeDeleted(this: any) {
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
    await CommentModel.updateMany(
      {
        postId: doc._id,
      },
      {
        deletedAt: new Date(),
      },
    );
  }
});
PostSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId",
  match: {
    onModel: On_Model_Enum.Post,
  },
});
const PostModel =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);
export default PostModel;
