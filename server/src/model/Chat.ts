import mongoose, { Mongoose } from "mongoose";
import { ref } from "process";

const ChatSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: false,
    },
    name: {
      type: String,
      default: "New Chat",
      required: false,
    },
    lastMessage: {
      type: String,
      default: "",
      required: false,
    },
    lastAnswer: {
      type: String,
      default: "",
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      requied: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Chat", ChatSchema);
