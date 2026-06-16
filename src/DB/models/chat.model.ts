import mongoose, { Types } from "mongoose";

interface IMessage {
  createdBy: Types.ObjectId;
  content: string;
}

export interface IChat {
  //ovo
  createdBy: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];

  //ovm
  group: string;
  groupImage: string;
  roomId: string;
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ChatSchema = new mongoose.Schema<IChat>(
  {
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    messages: [messageSchema],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    //ovm
    group: String,
    groupImage: String,
    roomId: String,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ChatModel =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
export default ChatModel;
