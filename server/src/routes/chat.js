"use strict";
/*

createChat
searchChats
uploadFile
    - convert to vector in pinecone

getMessages
sendMessage

*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const Chat_1 = __importDefault(require("../model/Chat"));
const Message_1 = __importDefault(require("../model/Message"));
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const helper_1 = require("../helper");
const File_1 = __importDefault(require("../model/File"));
const uploadStorage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: uploadStorage });
const router = (0, express_1.Router)();
router.use(auth_1.verify);
router.post("/upload/:chatId", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = req.params.chatId;
    const s3 = new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        },
    });
    const file = req.file;
    const { fileName, extension } = (0, helper_1.separateFileNameAndExtension)(`temp/${Date.now()}-${file.originalname}`);
    const params = {
        Bucket: process.env.BUCKET_NAME,
        Body: file.buffer,
        Key: `${fileName}.${extension}`,
        ContentType: file.mimetype,
    };
    const uploader = new lib_storage_1.Upload({
        client: s3,
        params,
    });
    yield (0, helper_1.convertPdfToVector)(file, chatId);
    const data = yield uploader.done();
    const uploadedFile = yield File_1.default.create({
        name: file.originalname,
        size: file.size,
        key: data.Key,
        url: data.Location,
    });
    yield Chat_1.default.updateOne({ _id: chatId }, {
        $set: {
            file: uploadedFile._id,
        },
    });
    res.status(200).send({
        message: "File Uploaded",
    });
}));
router.post("/message/ask/:chatId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const { question } = req.body || {};
    const { chatId } = req.params;
    if (!question) {
        res.status(400).send({
            message: "no question sent",
        });
        return;
    }
    yield Message_1.default.create({
        chat: chatId,
        msg: question,
        userId: req.user.userId,
        type: "question",
    });
    res.setHeader("Content-type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const answerStream = yield (0, helper_1.getAnswer)(question, chatId);
    let fullAnswer = "";
    try {
        for (var _d = true, answerStream_1 = __asyncValues(answerStream), answerStream_1_1; answerStream_1_1 = yield answerStream_1.next(), _a = answerStream_1_1.done, !_a; _d = true) {
            _c = answerStream_1_1.value;
            _d = false;
            const item = _c;
            const token = item === null || item === void 0 ? void 0 : item.text;
            if (token) {
                res.write(`data: ${token}\n\n`);
                fullAnswer += token;
            }
            if (item.isFinished) {
                res.write("event: done\ndata: end\n\n");
                res.end();
                yield Message_1.default.create({
                    chat: chatId,
                    msg: fullAnswer,
                    userId: req.user.userId,
                    type: "answer",
                });
                yield Chat_1.default.updateOne({ _id: chatId }, {
                    $set: {
                        lastMessage: question,
                        lastAnswer: fullAnswer,
                    },
                });
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = answerStream_1.return)) yield _b.call(answerStream_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const chat = yield Chat_1.default.create({
        userId: user.userId,
    });
    res.status(201).send({
        message: "Chat Created Successfully",
        chat: chat,
    });
}));
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { q, page = 0, limit = 30 } = req.query;
    let searchQuery = {
        userId: user.userId,
    };
    if (q)
        searchQuery.name = q;
    const chats = yield Chat_1.default.find(searchQuery)
        .populate("file")
        .sort({
        updatedAt: 1,
    })
        .skip(Number.parseInt(page.toString()) * Number.parseInt(limit.toString()))
        .limit(Number.parseInt(limit.toString()));
    res.status(200).send({
        chats: chats,
    });
}));
router.get("/message/:chatId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_a = req.params) === null || _a === void 0 ? void 0 : _a.chatId)) {
        res.status(400).send({
            message: "Chat Not Found",
        });
        return;
    }
    const user = req.user;
    const { q, page = 0, limit } = req.query;
    const pageNumber = parseInt((page === null || page === void 0 ? void 0 : page.toString()) || "0", 10);
    const pageLimit = parseInt((limit === null || limit === void 0 ? void 0 : limit.toString()) || "20", 10);
    let searchQuery = {
        userId: user.userId,
        chat: (_b = req.params) === null || _b === void 0 ? void 0 : _b.chatId,
    };
    // if (q) searchQuery.name = q;
    const messages = yield Message_1.default.find(searchQuery)
        .sort({
        updatedAt: -1,
    })
        .skip(pageNumber * pageLimit)
        .limit(pageLimit);
    res.status(200).send({
        chats: messages.reverse(),
    });
}));
exports.default = router;
