import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const signToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
};
