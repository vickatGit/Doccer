import mongoose from "mongoose";
import { config } from "dotenv";
config();

export const dbConnect = async () => {
  try {
    const connection = await mongoose.connect(process.env.dbUrl!);
    console.log("Connection to DB Done ✅✅");
    return connection;
  } catch (error) {
    console.log("connection to db failed ❌❌", error);
  }
};
