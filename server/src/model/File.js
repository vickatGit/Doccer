"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FileSchema = new mongoose_1.default.Schema({
    url: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
});
exports.default = mongoose_1.default.model("File", FileSchema);
