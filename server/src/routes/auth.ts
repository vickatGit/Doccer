import { Router, Response, RequestHandler } from "express";
import { LoginTicket, OAuth2Client } from "google-auth-library";
import { config } from "dotenv";
import User from "../model/User";
import jwt from "jsonwebtoken";
import { AuthRequest, verify } from "../middleware/auth";
import axios from "axios";
config();
const authClient = new OAuth2Client({
  client_id: process.env.GOOGLE_CLIENT_ID,
});
const router = Router();

export const validateUser = async (authCode: string): Promise<LoginTicket> => {
  try {
    // 1️⃣ Exchange auth code for tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code: authCode,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "postmessage", // For client-side apps use 'postmessage'
        grant_type: "authorization_code",
      }
    );

    const { id_token } = tokenResponse.data;

    if (!id_token) {
      throw new Error("ID token not found in token response");
    }

    // 2️⃣ Verify the ID token
    const authRes = await authClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = authRes.getPayload();

    return authRes;
  } catch (error) {
    console.error("Error validating user:", error);
    throw new Error("User validation failed");
  }
};
const getAuthToken = (user: any) => {
  const token = jwt?.sign(
    {
      email: user.email,
      name: user.name,
      userId: user._id.toString(),
    },
    process.env.JWT_AUTH_SECRET_KEY!,
    { expiresIn: "10d" }
  );
  return token;
};
router.post("/google", async (req, res: Response): Promise<any> => {
  const token = req.body.token;
  const authRes = await validateUser(token);
  const { email, name, picture } = authRes.getPayload()!;
  let user = await User.findOne({ email: email });

  if (!user) {
    user = await User.create({
      email: email,
      name: name,
      img: picture,
      type: "Verified",
    });
  }
  const authToken = getAuthToken(user);

  return res.status(200).send({
    message: "done",
    authToken: authToken,
  });
});

router.use(verify);
router.get("/details", verify, async (req: AuthRequest, res: Response) => {
  const user = await User.findOne({ _id: req.user.userId });
  res.status(200).send(user);
  return;
});

export default router;
