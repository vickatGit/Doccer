"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnswer = exports.convertPdfToVector = exports.getVectorDb = exports.convertChunksToEmbeddingVectors = exports.convertTextToChunks = void 0;
exports.separateFileNameAndExtension = separateFileNameAndExtension;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const cohere_ai_1 = require("cohere-ai");
const pinecone_1 = require("@pinecone-database/pinecone");
const aiClient = new cohere_ai_1.CohereClient({
    token: process.env.COHERE_API_KEY,
});
function separateFileNameAndExtension(filePath) {
    const lastSlashIndex = filePath.lastIndexOf("/");
    const fileNameWithExtension = lastSlashIndex !== -1 ? filePath.substring(lastSlashIndex + 1) : filePath;
    const lastDotIndex = fileNameWithExtension.lastIndexOf(".");
    const fileName = lastDotIndex !== -1
        ? fileNameWithExtension.substring(0, lastDotIndex)
        : fileNameWithExtension;
    const extension = lastDotIndex !== -1
        ? fileNameWithExtension.substring(lastDotIndex + 1)
        : "";
    return { fileName, extension };
}
const convertTextToChunks = (text, chunkSize, overlap) => {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        const chunk = text.slice(i, i + chunkSize);
        chunks.push(chunk);
        i += chunkSize - overlap;
    }
    return chunks;
};
exports.convertTextToChunks = convertTextToChunks;
const convertChunksToEmbeddingVectors = (chunks) => __awaiter(void 0, void 0, void 0, function* () {
    const embeddings = [];
    for (const chunk of chunks) {
        if (chunk.trim().length === 0)
            continue; // skip empty chunks
        const emb = yield aiClient.embed({
            model: "embed-english-v3.0",
            inputType: "search_document",
            texts: [chunk],
        });
        if (emb.embeddings[0]) {
            embeddings.push(emb.embeddings[0]);
        }
    }
    return { embeddings, chunks };
});
exports.convertChunksToEmbeddingVectors = convertChunksToEmbeddingVectors;
const getVectorDb = () => {
    const pinecone = new pinecone_1.Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    return pinecone.index("doccer");
};
exports.getVectorDb = getVectorDb;
const convertPdfToVector = (file, chatId) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (0, pdf_parse_1.default)(file.buffer);
    const textChunks = (0, exports.convertTextToChunks)(data.text, 500, 30);
    const { embeddings, chunks } = yield (0, exports.convertChunksToEmbeddingVectors)(textChunks);
    const doccerDb = (0, exports.getVectorDb)();
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
    yield doccerDb.upsert(vectorMapping);
});
exports.convertPdfToVector = convertPdfToVector;
const getAnswer = (question, chatId) => __awaiter(void 0, void 0, void 0, function* () {
    let queryEmb = yield aiClient.embed({
        texts: [question],
        model: "embed-english-v3.0",
        inputType: "search_query",
    });
    const queryVector = (queryEmb = queryEmb.embeddings[0]);
    const vectorDb = (0, exports.getVectorDb)();
    const vectorChunks = yield vectorDb.query({
        topK: 5,
        vector: queryVector,
        includeMetadata: true,
        filter: {
            fileId: chatId,
        },
    });
    const textChunks = vectorChunks.matches.map((chunk) => { var _a; return (_a = chunk === null || chunk === void 0 ? void 0 : chunk.metadata) === null || _a === void 0 ? void 0 : _a.text; });
    const context = textChunks.join(" ");
    const res = yield aiClient.generateStream({
        model: "command-r-plus",
        prompt: `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
              Question: {${question}} 
              Context: {${context}} 
              Answer:`,
        temperature: 0.3,
        maxTokens: 300,
    });
    return res;
});
exports.getAnswer = getAnswer;
