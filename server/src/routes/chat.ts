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
  convertFileToVector,
  detectChatName,
  getAnswer,
  separateFileNameAndExtension,
} from "../helper";
import { AuthRequest, verify } from "../middleware/auth";
import Chat from "../model/Chat";
import File from "../model/File";
import Message from "../model/Message";
import ablyService from "../service/ablyService";
import mongoose from "mongoose";

const uploadStorage = multer.memoryStorage();
const upload = multer({ storage: uploadStorage });

const router = Router();
router.use(verify);

// router.post(
//   "/upload/:chatId",
//   upload.single("file"),
//   async (req: AuthRequest, res: Response) => {
//     const chatId = req.params.chatId;
//     const s3 = new S3Client({
//       region: process.env.AWS_REGION,
//       credentials: {
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//       },
//     });
//     const file = req.file;

//     const { fileName, extension } = separateFileNameAndExtension(
//       `temp/${Date.now()}-${file.originalname}`
//     );
//     const params = {
//       Bucket: process.env.BUCKET_NAME,
//       Body: file.buffer,
//       Key: `${fileName}.${extension}`,
//       ContentType: file.mimetype,
//     };
//     const uploader = new Upload({
//       client: s3,
//       params,
//     });
//     await convertPdfToVector(file, chatId);
//     const data = await uploader.done();
//     const uploadedFile = await File.create({
//       name: file.originalname,
//       size: file.size,
//       key: data.Key,
//       url: data.Location,
//     });

//     await Chat.updateOne(
//       { _id: chatId },
//       {
//         $set: {
//           file: uploadedFile._id,
//         },
//       }
//     );

//     res.status(200).send({
//       message: "File Uploaded",
//     });
//   }
// );

router.post(
  "/upload/:chatId",
  upload.array("files"), // multiple files
  async (req: AuthRequest, res: any) => {
    const chatId = req.params.chatId;
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    try {
      const uploadedFileIds: mongoose.Types.ObjectId[] = [];

      for (const file of files) {
        const { fileName, extension } = separateFileNameAndExtension(
          `temp/${Date.now()}-${file.originalname}`
        );

        const params = {
          Bucket: process.env.BUCKET_NAME!,
          Body: file.buffer,
          Key: `${fileName}.${extension}`,
          ContentType: file.mimetype,
        };

        const uploader = new Upload({ client: s3, params });
        const data = await uploader.done();

        // 1️⃣ Create File document first
        const uploadedFile = await File.create({
          name: file.originalname,
          size: file.size,
          key: data.Key,
          url: data.Location,
        });
        uploadedFileIds.push(uploadedFile._id);

        console.log(
          `File ${file.originalname} uploaded and saved to DB with id ${uploadedFile._id}`
        );

        // 2️⃣ Convert file to vector embeddings
        await convertFileToVector(file, uploadedFile._id, chatId);
        console.log(`File ${file.originalname} converted to vector embeddings`);
      }

      // Update chat with all uploaded file IDs
      await Chat.updateOne(
        { _id: chatId },
        { $push: { files: { $each: uploadedFileIds } } }
      );

      res.status(200).json({
        message: "Files uploaded and processed successfully",
        files: uploadedFileIds,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "File upload failed", error });
    }
  }
);

router.post("/message/ask/:chatId", async (req: AuthRequest, res: any) => {
  const { question } = req.body || {};
  const { chatId } = req.params;
  if (!question) {
    return res.status(400).send({ message: "no question sent" });
  }

  const fChat = await Chat.findOne({ _id: chatId });
  if (fChat.name === "New Chat") {
    const chatName = await detectChatName(question);
    fChat.name = chatName;
    fChat.save();
  }

  // Save question as a message
  await Message.create({
    chat: chatId,
    msg: question,
    userId: req.user.userId,
    type: "question",
  });

  // Start Ably events: responseStart (room + user)
  try {
    await ablyService.publishResponseStarted(chatId, req.user.userId, {
      promptSnippet: question.slice(0, 120),
    });
  } catch (err) {
    console.error("publishResponseStarted err:", err);
    // continue; we still proceed with AI generation
  }

  // Stream AI response
  const stream = await getAnswer(question, chatId);
  let fullResponse = "";
  let seq = 0;
  let streamError = false;

  try {
    for await (const event of stream) {
      switch (event.type) {
        case "message-start":
          console.log("🟢 Message started");
          break;

        case "content-start":
          console.log("🟡 Content generation started");
          break;

        case "content-delta":
          {
            const deltaText = event.delta.message.content.text ?? "";
            fullResponse += deltaText;

            // publish chunk to room (only online viewers)
            try {
              await ablyService.publishResponseStreamChunk(
                chatId,
                req.user.userId,
                deltaText,
                seq++
              );
            } catch (err) {
              console.error("publishResponseStreamChunk err:", err);
            }
          }
          break;

        case "content-end":
          console.log("\n🟠 Content generation ended");
          break;

        case "message-end":
          console.log("🔵 Message generation completed");

          // Save final answer to DB
          const message = await Message.create({
            chat: chatId,
            msg: fullResponse,
            userId: req.user.userId,
            type: "answer",
          });

          // update chat lastMessage/lastAnswer
          await Chat.updateOne(
            { _id: chatId },
            {
              $set: {
                lastMessage: question,
                lastAnswer: fullResponse,
              },
            }
          );

          // publish responseDone (room + user) to update UIs
          try {
            await ablyService.publishResponseDone(chatId, req.user.userId, {
              text: message,
            });
          } catch (err) {
            console.error("publishResponseDone err:", err);
          }

          // If you're using SSE or long-polling you may end the response here; but keep consistent with your setup:
          // res.write("event: done\ndata: end\n\n");
          // res.end();
          break;

        default:
          console.log("⚪ Unknown event:", event);
          break;
      }
    }
  } catch (err) {
    streamError = true;
    console.error("AI stream error:", err);
    // notify client via Ably
    try {
      await ablyService.publishResponseFailed(chatId, req.user.userId, {
        message: (err && err.message) || "AI generation failed",
      });
    } catch (x) {
      console.error("publishResponseFailed err:", x);
    }
    // You might also want to send HTTP 500 if your endpoint expects synchronous completion
    // res.status(500).send({ message: "AI generation failed" });
  }

  console.log("full response : ", fullResponse);
  // respond to HTTP caller if appropriate (this route previously used SSE/res.write)
  return res.status(200).json({ status: streamError ? "failed" : "ok" });
});

// router.post("/message/ask/:chatId", async (req: AuthRequest, res: Response) => {
//   const { question } = req.body || {};
//   const { chatId } = req.params;
//   if (!question) {
//     res.status(400).send({
//       message: "no question sent",
//     });
//     return;
//   }
//   await Message.create({
//     chat: chatId,
//     msg: question,
//     userId: req.user.userId,
//     type: "question",
//   });

//   const stream = await getAnswer(question, chatId);
//   let fullResponse = "";

//   for await (const event of stream) {
//     switch (event.type) {
//       case "message-start":
//         console.log("🟢 Message started");
//         break;

//       case "content-start":
//         console.log("🟡 Content generation started");
//         break;

//       case "content-delta":
//         console.log("delts : ", event.delta);
//         fullResponse += event.delta.message.content.text ?? "";
//         break;

//       case "content-end":
//         console.log("\n🟠 Content generation ended");
//         break;

//       case "message-end":
//         console.log("🔵 Message generation completed");
//         res.write("event: done\ndata: end\n\n");
//         res.end();

//         await Message.create({
//           chat: chatId,
//           msg: fullResponse,
//           userId: req.user.userId,
//           type: "answer",
//         });

//         await Chat.updateOne(
//           { _id: chatId },
//           {
//             $set: {
//               lastMessage: question,
//               lastAnswer: fullResponse,
//             },
//           }
//         );
//         console.log("🟢 Message Saved to DB");
//         break;

//       default:
//         console.log("⚪ Unknown event:", event);
//         break;
//     }
//   }
//   console.log("full response : ", fullResponse);
// });

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
      .populate("files")
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
