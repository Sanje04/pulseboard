import bcrypt from "bcrypt";
import { User } from "../models/user";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, passwordHash });
  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  return user;
};
