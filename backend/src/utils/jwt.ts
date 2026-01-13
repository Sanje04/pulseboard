import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface JwtPayload {
  sub: string;
}

export const signToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
