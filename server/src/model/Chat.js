"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ChatSchema = new mongoose_1.default.Schema({
    file: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        requied: false,
    },
});
exports.default = mongoose_1.default.model("Chat", ChatSchema);
