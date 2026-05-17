import mongoose, { Types } from "mongoose";
import { On_Model_Enum } from "../../common/enum/post.enum";

export interface IComment {
  content?: string;
  attachments?: string[];
  createBy: Types.ObjectId;

  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  // postId: Types.ObjectId;
  // commentId?: Types.ObjectId;
  refId: Types.ObjectId;
  onModel: On_Model_Enum;

  folderId: string;
  deletedAt?: Date;
}
const CommentSchema = new mongoose.Schema<IComment>(
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
    // postId: { type: Types.ObjectId, ref: "Post", required: true },
    // commentId: { type: Types.ObjectId, ref: "Comment" },
    refId: { type: Types.ObjectId, refPath: "onModel", required: true }, // postId or commentId
    onModel: { type: String, enum: On_Model_Enum, required: true }, // either post or comment

    tags: [{ type: Types.ObjectId, ref: "User" }],
    likes: [{ type: Types.ObjectId, ref: "User" }],

    folderId: String,
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    strictQuery: true,
    strict: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

CommentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "refId", // which is commentId in the first version
  match: {
    onModel: On_Model_Enum.Comment,
  },
});

// function excludeDeleted(this: any) {
//   const { paranoid, ...rest } = this.getQuery();

//   if (paranoid == false) {
//     this.setQuery({ ...rest });
//   } else {
//     this.setQuery({ ...rest, deletedAt: { $exists: false } });
//   }
// }
function excludeDeleted(this: any) {
  this.where({ deletedAt: null });
}
CommentSchema.pre("find", excludeDeleted);
CommentSchema.pre("findOne", excludeDeleted);

const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);
export default CommentModel;
