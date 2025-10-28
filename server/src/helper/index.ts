import Pdf from "pdf-parse";
import { CohereClientV2 } from "cohere-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  EmbedByTypeResponse,
  EmbedInput,
  GenerateStreamedResponse,
  V2ChatStreamResponse,
} from "cohere-ai/api";
import { Stream } from "cohere-ai/core";
const aiClient = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});
import { Response } from "express";
import Message from "../model/Message";
import Chat from "../model/Chat";
import mongoose from "mongoose";
import mammoth from "mammoth";
export function separateFileNameAndExtension(filePath: string): {
  fileName: string;
  extension: string;
} {
  const lastSlashIndex = filePath.lastIndexOf("/");
  const fileNameWithExtension =
    lastSlashIndex !== -1 ? filePath.substring(lastSlashIndex + 1) : filePath;
  const lastDotIndex = fileNameWithExtension.lastIndexOf(".");
  const fileName =
    lastDotIndex !== -1
      ? fileNameWithExtension.substring(0, lastDotIndex)
      : fileNameWithExtension;
  const extension =
    lastDotIndex !== -1
      ? fileNameWithExtension.substring(lastDotIndex + 1)
      : "";
  return { fileName, extension };
}
export const convertTextToChunks = (
  text: string,
  chunkSize: number,
  overlap: number
): string[] => {
  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    const chunk = text.slice(i, i + chunkSize);
    chunks.push(chunk);
    i += chunkSize - overlap;
  }

  return chunks;
};
// export const convertChunksToEmbeddingVectors = async (chunks: string[]) => {
//   const embeddings: any[] = [];
//   for (const chunk of chunks) {
//     if (chunk.trim().length === 0) continue; // skip empty chunks

//     const emb = await aiClient.embed({
//       model: "embed-english-v3.0",
//       inputType: "search_document",
//       texts: [chunk],
//     });

//     if (emb.embeddings[0]) {
//       embeddings.push(emb.embeddings[0]);
//     }
//   }
//   return { embeddings, chunks };
// };

export const convertChunksToEmbeddingVectors = async (chunks: string[]) => {
  const embeddings: number[][] = [];

  // Skip empty chunks
  const validChunks = chunks.filter((c) => c.trim().length > 0);
  if (validChunks.length === 0) return { embeddings, chunks };

  // Build text_inputs in the new v4 format
  const textInputs: EmbedInput[] = validChunks.map((chunk) => ({
    content: [{ type: "text", text: chunk }],
  }));

  try {
    const response = await aiClient.embed({
      model: "embed-english-v3.0",
      inputs: textInputs,
      inputType: "search_document", // or classification depending on your use-case
      embeddingTypes: ["float"],
    });

    console.log("Embedding response:", response);

    // Extract embeddings
    if (response.embeddings?.float) {
      embeddings.push(...response.embeddings.float);
    }
  } catch (error) {
    console.error("Error generating embeddings:", error);
  }

  if (embeddings.length === 0) {
    console.warn("No embeddings generated for any chunks.");
  }

  return { embeddings, chunks };
};

export const getVectorDb = () => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  return pinecone.index("doccer");
};
// export const convertPdfToVector = async (
//   file: Express.Multer.File,
//   chatId: string
// ) => {
//   const data = await Pdf(file.buffer);
//   const textChunks = convertTextToChunks(data.text, 500, 30);
//   const { embeddings, chunks } = await convertChunksToEmbeddingVectors(
//     textChunks
//   );
//   const doccerDb = getVectorDb();
//   const vectorMapping = embeddings.map((emb, index) => {
//     return {
//       id: `${chatId}${index}`,
//       values: emb,
//       metadata: {
//         fileId: `${chatId}`,
//         fileName: `${file.originalname}`,
//         text: chunks[index],
//       },
//     };
//   });
//   await doccerDb.upsert(vectorMapping);
// };

export const convertFileToVector = async (
  file: Express.Multer.File,
  fileId: mongoose.Types.ObjectId,
  chatId: string
) => {
  let text = "";

  const ext = file.originalname.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      text = (await Pdf(file.buffer)).text;
      break;
    case "docx":
      text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
      break;
    case "doc":
      text = file.buffer.toString("utf-8"); // simple approximation
      break;
    case "txt":
      text = file.buffer.toString("utf-8");
      break;
    case "csv":
      text = file.buffer.toString("utf-8"); // treat as raw text
      break;
    default:
      console.warn(`Unsupported file type: ${file.originalname}`);
      return;
  }

  const textChunks = convertTextToChunks(text, 500, 30);
  const { embeddings, chunks } = await convertChunksToEmbeddingVectors(
    textChunks
  );

  console.log("text Chunks : ", embeddings, chunks);
  const doccerDb = getVectorDb();
  const vectorMapping = embeddings.map((emb, index) => ({
    id: `${fileId}${index}`,
    values: emb,
    metadata: {
      fileId: fileId.toString(),
      fileName: file.originalname,
      text: chunks[index],
      chatId,
    },
  }));

  await doccerDb.upsert(vectorMapping);
};

export const detectChatName = async (question: string) => {
  const contextRes = await aiClient.chat({
    model: "command-a-03-2025",
    messages: [
      {
        role: "system",
        content: `You are a context detection assistant.
Your job is to summarize what the user is trying to do or talk about
in a short, descriptive phrase of 1–7 words.
No punctuation, no extra text — only output the phrase.
Examples:
- "React component debugging"
- "Summarize research paper"
- "Job interview preparation"
- "PDF question answering"
- "AI model fine tuning"`,
      },
      {
        role: "user",
        content: question,
      },
    ],
    temperature: 0.2,
  });
  console.log("context : ", JSON.stringify(contextRes, null, 4));
  const contextLabel = (contextRes.message.content[0] as any)?.text.trim();
  return contextLabel;
};

// export const getAnswer = async (
//   question: string,
//   chatId: string
// ): Promise<Stream<V2ChatStreamResponse>> => {
//   let queryEmb = await aiClient.embed({
//     texts: [question],
//     model: "embed-english-v3.0",
//     inputType: "search_query",
//   });
//   let chat = await Chat.findOne({ _id: chatId });
//   try {
//     const queryVector = queryEmb.embeddings.float[0];
//     const vectorDb = getVectorDb();
//     const vectorChunks = await vectorDb.query({
//       topK: 5,
//       vector: queryVector,
//       includeMetadata: true,
//       filter: {
//         fileId: { $in: chat.files.map((file) => file.toString()) },
//       },
//     });

//     const textChunks = vectorChunks.matches.map(
//       (chunk) => chunk?.metadata?.text
//     );
//     const context = textChunks.join(" ");
//     const res = await aiClient.chatStream({
//       model: "command-a-03-2025",
//       messages: [
//         {
//           role: "system",
//           content: "You are an assistant for question-answering tasks.",
//         },
//         {
//           role: "user",
//           content: `Use the following context to answer briefly format.
//                               Question: ${question}
//                               Context: ${context}`,
//         },
//       ],
//       temperature: 0.3,
//     });

//     return res;
//   } catch (error) {
//     console.log("error : ", error);
//   }
// };

export const getAnswer = async (
  question: string,
  chatId: string,
  streamSpeedMs: number = Number(process.env.STREAM_SPEED_IN_MS) || 50 // adjustable stream speed (ms delay between chunks)
): Promise<AsyncGenerator<V2ChatStreamResponse>> => {
  const queryEmb = await aiClient.embed({
    texts: [question],
    model: "embed-english-v3.0",
    inputType: "search_query",
  });

  const chat = await Chat.findOne({ _id: chatId });
  if (!chat) throw new Error("Chat not found");

  try {
    const queryVector = queryEmb.embeddings.float[0];
    const vectorDb = getVectorDb();
    const vectorChunks = await vectorDb.query({
      topK: 5,
      vector: queryVector,
      includeMetadata: true,
      filter: { fileId: { $in: chat.files.map((f) => f.toString()) } },
    });

    const textChunks = vectorChunks.matches.map((c) => c?.metadata?.text || "");
    const context = textChunks.join(" ");

    // Get raw Cohere stream
    const cohereStream = await aiClient.chatStream({
      model: "command-a-03-2025",
      messages: [
        {
          role: "system",
          content: "You are an assistant for question-answering tasks.",
        },
        {
          role: "user",
          content: `Use the following context to answer briefly.
                    Question: ${question}
                    Context: ${context}`,
        },
      ],
      temperature: 0.3,
    });

    // Throttled async generator wrapper
    async function* throttledStream() {
      for await (const event of cohereStream) {
        yield event;
        await new Promise((res) => setTimeout(res, streamSpeedMs)); // Control rate here
      }
    }

    // Return throttled stream instead of raw Cohere stream
    return throttledStream();
  } catch (error) {
    console.error("getAnswer error:", error);
    throw error;
  }
};
