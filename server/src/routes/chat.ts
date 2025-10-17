/*

createChat
searchChats
uploadFile
    - convert to vector in pinecone

getMessages
sendMessage

*/

import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Response, Router } from "express";
import multer from "multer";
import {
  convertPdfToVector,
  getAnswer,
  separateFileNameAndExtension,
} from "../helper";
import { AuthRequest, verify } from "../middleware/auth";
import Chat from "../model/Chat";
import File from "../model/File";
import Message from "../model/Message";

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

  const stream = await getAnswer(question, chatId);
  let fullResponse = "";

  for await (const event of stream) {
    switch (event.type) {
      case "message-start":
        console.log("🟢 Message started");
        break;

      case "content-start":
        console.log("🟡 Content generation started");
        break;

      case "content-delta":
        console.log("delts : ", event.delta);
        fullResponse += event.delta.message.content.text ?? "";
        break;

      case "content-end":
        console.log("\n🟠 Content generation ended");
        break;

      case "message-end":
        console.log("🔵 Message generation completed");
        res.write("event: done\ndata: end\n\n");
        res.end();

        await Message.create({
          chat: chatId,
          msg: fullResponse,
          userId: req.user.userId,
          type: "answer",
        });

        await Chat.updateOne(
          { _id: chatId },
          {
            $set: {
              lastMessage: question,
              lastAnswer: fullResponse,
            },
          }
        );
        console.log("🟢 Message Saved to DB");
        break;

      default:
        console.log("⚪ Unknown event:", event);
        break;
    }
  }
  console.log("full response : ", fullResponse);
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
  try {
    const user = req.user;
    const {
      limit = "20",
      cursor,
      search,
      startDate,
      endDate,
    } = req.query as Record<string, string | undefined>;

    const parsedLimit = Math.min(100, Math.max(5, parseInt(limit || "20"))); // bounds

    // Base filter: only chats for this user (adjust if necessary)
    const filter: any = {
      userId: user.userId,
    };

    // Date range filter on createdAt (if provided)
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Server-side search on name (case-insensitive, partial)
    if (search && search.trim().length > 0) {
      // Use text index or regex. Regex is simple but not optimal for large scale.
      // For production consider adding a text index and using $text.
      filter.name = { $regex: escapeRegex(search.trim()), $options: "i" };
    }

    // Cursor: only get rooms whose updatedAt is < cursor (we sort descending)
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        filter.updatedAt = { $lt: cursorDate };
      }
    }

    const chats = await Chat.find(filter)
      .sort({ updatedAt: -1 })
      .limit(parsedLimit + 1) // fetch one extra to determine nextCursor
      .populate("file")
      .lean()
      .exec();

    let hasNext = false;
    let results = chats;

    if (chats.length > parsedLimit) {
      hasNext = true;
      results = chats.slice(0, parsedLimit);
    }

    const nextCursor = hasNext
      ? results[results.length - 1].updatedAt.toISOString()
      : null;

    res.status(200).json({
      chats: results,
      nextCursor,
    });
  } catch (err) {
    console.error("GET /api/chats error", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

function escapeRegex(text: string) {
  // prevent regex injection
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// router.get("/search", async (req: AuthRequest, res: Response) => {
//   const user = req.user;
//   const { q, page = 0, limit = 30 } = req.query;
//   let searchQuery: any = {
//     userId: user.userId,
//   };
//   if (q) searchQuery.name = q;
//   const chats = await Chat.find(searchQuery)
//     .populate("file")
//     .sort({
//       updatedAt: -1,
//     })
//     .skip(Number.parseInt(page.toString()) * Number.parseInt(limit.toString()))
//     .limit(Number.parseInt(limit.toString()));
//   res.status(200).send({
//     chats: chats,
//   });
// });

// router.get("/message/:chatId", async (req: AuthRequest, res: Response) => {
//   if (!req.params?.chatId) {
//     res.status(400).send({
//       message: "Chat Not Found",
//     });
//     return;
//   }
//   const user = req.user;
//   const { q, page = 0, limit } = req.query;
//   const pageNumber = parseInt(page?.toString() || "0", 10);
//   const pageLimit = parseInt(limit?.toString() || "20", 10);
//   let searchQuery: any = {
//     userId: user.userId,
//     chat: req.params?.chatId,
//   };
//   // if (q) searchQuery.name = q;
//   const messages = await Message.find(searchQuery)
//     .sort({
//       updatedAt: -1,
//     })
//     .skip(pageNumber * pageLimit)
//     .limit(pageLimit);
//   res.status(200).send({
//     chats: messages.reverse(),
//   });
// });

// GET /api/chat/message/:chatId?cursor=<timestamp>&limit=<number>

router.get("/message/:chatId", async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      res.status(400).send({ message: "Chat ID is required" });
    }

    const { cursor, limit = 20 } = req.query;
    const user = req.user;

    const query: any = { chat: chatId, userId: user.userId };

    // If cursor provided, fetch messages older than cursor
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor.toString()) };
    }

    // Fetch messages newest first, then reverse them for correct display
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit.toString(), 10));

    const hasMore = messages.length === parseInt(limit.toString(), 10);

    res.status(200).send({
      messages: messages.reverse(),
      nextCursor: hasMore ? messages[0].createdAt : null,
      hasMore,
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send({ message: "Internal Server Error" });
  }
  return;
});

export default router;
