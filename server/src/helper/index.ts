import Pdf from "pdf-parse";
import { CohereClient } from "cohere-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GenerateStreamedResponse } from "cohere-ai/api";
import { Stream } from "cohere-ai/core";
const aiClient = new CohereClient({
  token: process.env.COHERE_API_KEY,
});
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
export const convertChunksToEmbeddingVectors = async (chunks: string[]) => {
  const embeddings: any[] = [];
  for (const chunk of chunks) {
    if (chunk.trim().length === 0) continue; // skip empty chunks

    const emb = await aiClient.embed({
      model: "embed-english-v3.0",
      inputType: "search_document",
      texts: [chunk],
    });

    if (emb.embeddings[0]) {
      embeddings.push(emb.embeddings[0]);
    }
  }
  return { embeddings, chunks };
};
export const getVectorDb = () => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  return pinecone.index("doccer");
};
export const convertPdfToVector = async (
  file: Express.Multer.File,
  chatId: string
) => {
  const data = await Pdf(file.buffer);
  const textChunks = convertTextToChunks(data.text, 500, 30);
  const { embeddings, chunks } = await convertChunksToEmbeddingVectors(
    textChunks
  );
  const doccerDb = getVectorDb();
  const vectorMapping = embeddings.map((emb, index) => {
    return {
      id: `${chatId}${index}`,
      values: emb,
      metadata: {
        fileId: `${chatId}`,
        fileName: `${file.originalname}`,
        text: chunks[index],
      },
    };
  });
  await doccerDb.upsert(vectorMapping);
};

export const getAnswer = async (
  question: string,
  chatId: string
): Promise<Stream<GenerateStreamedResponse>> => {
  let queryEmb = await aiClient.embed({
    texts: [question],
    model: "embed-english-v3.0",
    inputType: "search_query",
  });
  const queryVector = (queryEmb = queryEmb.embeddings[0]);
  const vectorDb = getVectorDb();
  const vectorChunks = await vectorDb.query({
    topK: 5,
    vector: queryVector,
    includeMetadata: true,
    filter: {
      fileId: chatId,
    },
  });

  const textChunks = vectorChunks.matches.map((chunk) => chunk?.metadata?.text);
  const context = textChunks.join(" ");
  const res = await aiClient.generateStream({
    model: "command-r-plus",
    prompt: `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
              Question: {${question}} 
              Context: {${context}} 
              Answer:`,
    temperature: 0.3,
    maxTokens: 300,
  });

  return res;
};
