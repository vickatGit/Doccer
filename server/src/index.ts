import express from "express";
import { config } from "dotenv";
import { dbConnect } from "./utils/dbConnect";
import routes from "./routes";
import cors from "cors";
config();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api", routes);

//Health Route
app.get("/", (req: any, res: any) => {
  return res.send("Server Health is Good ✅✅");
});

app.listen(process.env.PORT, async () => {
  await dbConnect();
  console.log(`server started listening on ${process.env.PORT} 🚀🚀`);
});
