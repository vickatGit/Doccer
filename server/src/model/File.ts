import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
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

export default mongoose.model("File", FileSchema);
