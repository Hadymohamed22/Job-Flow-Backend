import { RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "../types/global";

export const verifyToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({
      error: true,
      message: "Token is not provided !",
    });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token!,
      process.env.JWT_SECRET as string,
    ) as JwtPayload & { id: string };
    (req as AuthRequest).user = { id: decoded.id };

    return next();
  } catch (e) {
    console.error(`Verify Token failed : ` + (e as Error).message);
    res.status(401).json({
      error: true,
      message: "Unauthorized User !",
    });
  }
};
