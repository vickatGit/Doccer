// src/routes/ablyRoutes.ts
import express from "express";
import ablyService from "../service/ablyService";
import { AuthRequest, verify } from "../middleware/auth"; // your auth middleware

const router = express.Router();

router.use(verify);
router.post("/token-request", async (req: AuthRequest, res) => {
  try {
    const userId = req.user.userId.toString();
    const tokenRequest = await ablyService.createTokenRequestForUser(userId);
    res.json(tokenRequest);
  } catch (err) {
    console.error("token-request err:", err);
    res.status(500).json({ message: "Could not create token request" });
  }
});

export default router;
