"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const chat_1 = __importDefault(require("./chat"));
const router = (0, express_1.Router)();
router.use("/auth", auth_1.default);
router.use("/chat", chat_1.default);
exports.default = router;
// const bufferStorage = multer.memoryStorage();
// const uploader = multer({ storage: bufferStorage });
// router.post(
//   "/upload",
//   uploader.single("file"),
//   (req: Request, res: Response) => {
//     const file = req.file
//     if(!file){
//       res.status(404).send({
//         message:"File Not Received"
//       })
//     }
//   }
// );
