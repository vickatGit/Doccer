/*

createChat
searchChats
uploadFile
    - convert to vector in pinecone

getMessages
sendMessage

*/

import { Response, Router } from "express";
import multer from "multer";
import { AuthRequest, verify } from "../middleware/auth";
import Chat from "../model/Chat";
import Message from "../model/Message";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { randomUUID } from "crypto";
import {
  convertPdfToVector,
  getAnswer,
  separateFileNameAndExtension,
} from "../helper";
import File from "../model/File";
import Pdf from "pdf-parse";

const uploadStorage = multer.memoryStorage();
const upload = multer({ storage: uploadStorage });

const router = Router();
router.use(verify);

router.post(
  "/upload/:chatId",
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    const chatId = req.params.chatId;
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      },
    });
    const file = req.file;

    const { fileName, extension } = separateFileNameAndExtension(
      `temp/${Date.now()}-${file.originalname}`
    );
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Body: file.buffer,
      Key: `${fileName}.${extension}`,
      ContentType: file.mimetype,
    };
    const uploader = new Upload({
      client: s3,
      params,
    });
    await convertPdfToVector(file, chatId);
    const data = await uploader.done();
    const uploadedFile = await File.create({
      name: file.originalname,
      size: file.size,
      key: data.Key,
      url: data.Location,
    });

    await Chat.updateOne(
      { _id: chatId },
      {
        $set: {
          file: uploadedFile._id,
        },
      }
    );

    res.status(200).send({
      message: "File Uploaded",
    });
  }
);

router.post("/message/ask/:chatId", async (req: AuthRequest, res: Response) => {
  const { question } = req.body || {};
  const { chatId } = req.params;
  if (!question) {
    res.status(400).send({
      message: "no question sent",
    });
    return;
  }
  await Message.create({
    chat: chatId,
    msg: question,
    userId: req.user.userId,
    type: "question",
  });
  res.setHeader("Content-type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const answerStream = await getAnswer(question, chatId);
  let fullAnswer = "";
  for await (const item of answerStream) {
    const token = (item as any)?.text;
    if (token) {
      res.write(`data: ${token}\n\n`);
      fullAnswer += token;
    }

    if (item.isFinished) {
      res.write("event: done\ndata: end\n\n");
      res.end();

      await Message.create({
        chat: chatId,
        msg: fullAnswer,
        userId: req.user.userId,
        type: "answer",
      });

      await Chat.updateOne(
        { _id: chatId },
        {
          $set: {
            lastMessage: question,
            lastAnswer: fullAnswer,
          },
        }
      );
    }
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const chat = await Chat.create({
    userId: user.userId,
  });
  res.status(201).send({
    message: "Chat Created Successfully",
    chat: chat,
  });
});

router.get("/search", async (req: AuthRequest, res: Response) => {
  const user = req.user;
  const { q, page = 0, limit = 30 } = req.query;
  let searchQuery: any = {
    userId: user.userId,
  };
  if (q) searchQuery.name = q;
  const chats = await Chat.find(searchQuery)
    .populate("file")
    .sort({
      updatedAt: 1,
    })
    .skip(Number.parseInt(page.toString()) * Number.parseInt(limit.toString()))
    .limit(Number.parseInt(limit.toString()));
  res.status(200).send({
    chats: chats,
  });
});

router.get("/message/:chatId", async (req: AuthRequest, res: Response) => {
  if (!req.params?.chatId) {
    res.status(400).send({
      message: "Chat Not Found",
    });
    return;
  }
  const user = req.user;
  const { q, page = 0, limit } = req.query;
  const pageNumber = parseInt(page?.toString() || "0", 10);
  const pageLimit = parseInt(limit?.toString() || "20", 10);
  let searchQuery: any = {
    userId: user.userId,
    chat: req.params?.chatId,
  };
  // if (q) searchQuery.name = q;
  const messages = await Message.find(searchQuery)
    .sort({
      updatedAt: -1,
    })
    .skip(pageNumber * pageLimit)
    .limit(pageLimit);
  res.status(200).send({
    chats: messages.reverse(),
  });
});

export default router;
