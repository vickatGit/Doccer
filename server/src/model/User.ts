import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

export default mongoose.model("User", UserSchema);
