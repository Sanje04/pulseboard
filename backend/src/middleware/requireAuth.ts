import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

// Extend Request to include userId
export interface AuthRequest extends Request {
  userId?: string;
}

// Middleware to require authentication
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1️⃣ Get token from Authorization header
  const header = req.headers.authorization;

  // 2️⃣ Validate token presence
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 3️⃣ Verify token
  const token = header.substring("Bearer ".length).trim();

  // 4️⃣ If valid, attach userId to req and call next()
  try {
    const payload = verifyToken(token); // { sub: userId }
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
