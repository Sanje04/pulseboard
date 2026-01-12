import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { signToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const user = await registerUser(name, email, password);
  const token = signToken(user.id);

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    accessToken: token
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await loginUser(email, password);
  const token = signToken(user.id);

  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    accessToken: token
  });
};
