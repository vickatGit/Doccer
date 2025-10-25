import express from "express";
import { config } from "dotenv";
import { dbConnect } from "./utils/dbConnect";
import routes from "./routes";
import cors from "cors";
import { CohereClientV2 } from "cohere-ai";
import { Pinecone } from "@pinecone-database/pinecone";
config();

const app = express();
const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

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
  // try {
  //   console.log("🔍 Testing your Cohere API key...");

  //   const response = await cohere.chat({
  //     model: "command-a-03-2025",
  //     messages: [{ role: "user", content: "Say hello world" }],
  //   });

  //   console.log("✅ API key is valid!");
  //   console.log("Response:", response);
  // } catch (err) {
  //   console.error("❌ API key test failed");
  //   console.error(err);
  // }

  try {
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const indexName = "doccer";
    const index = client.index(indexName);

    // This will check if the index metadata is accessible
    const stats: any = await index.describeIndexStats();

    console.log("✅ Pinecone index is healthy!");
    console.log(`Total vectors: ${JSON.stringify(stats)}`);
    return { ok: true, stats };
  } catch (error: any) {
    console.error("❌ Pinecone health check failed:", error.message);
    return { ok: false, error };
  }
});
