import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import authRoutes from "./auth";
import chatRoutes from "./chat";
const router = Router();

router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
export default router;

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
