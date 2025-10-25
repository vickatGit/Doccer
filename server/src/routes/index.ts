import { Router } from "express";
import ablyRoutes from "./ably";
import authRoutes from "./auth";
import chatRoutes from "./chat";
const router = Router();

router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/ably", ablyRoutes);
export default router;
