import mongoose, { Types } from "mongoose";

export interface IComment {
  content?: string;
  attachments?: string[];
  createBy: Types.ObjectId;

  tags?: Types.ObjectId[];
  likes?: Types.ObjectId[];
  postId: Types.ObjectId;

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
    postId: { type: Types.ObjectId, ref: "Post", required: true },

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

// function excludeDeleted(this: any) {
//   const { paranoid, ...rest } = this.getQuery();

//   if (paranoid == false) {
//     this.setQuery({ ...rest });
//   } else {
//     this.setQuery({ ...rest, deletedAt: { $exists: false } });
//   }
// }
function excludeDeleted(this: any) {
  this.where({ deletedAt: { $exists: false } });
}
CommentSchema.pre("find", excludeDeleted);
CommentSchema.pre("findOne", excludeDeleted);

const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);
export default CommentModel;
