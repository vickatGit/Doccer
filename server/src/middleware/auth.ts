import jwt from "jsonwebtoken";
import { Response, Request, NextFunction } from "express";
import { config } from "dotenv";
config();
export interface AuthRequest extends Request {
  user: {
    email: string;
    name: string;
    userId: string;
  };
}
export const verify = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let authToken: string =
      req.headers.authorization || (req.headers.Authorization as string);
    authToken = authToken.split("Bearer")?.[1]?.trim();
    const decoded = jwt.verify(
      authToken,
      process.env.JWT_AUTH_SECRET_KEY!
    ) as jwt.JwtPayload;
    if (decoded) {
      req.user = {
        email: decoded.email,
        name: decoded.name,
        userId: decoded.userId,
      };
      next();
    } else {
      res.status(400).send({
        message: "Login Required",
      });
      return;
    }
  } catch (error) {
    res.status(400).send({
      message: "Login Failed",
      error: error?.toString(),
    });
    return;
  }
};
