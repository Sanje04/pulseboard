import dotenv from "dotenv";

dotenv.config();
// Load environment variables from .env file
export const env = {
  PORT: process.env.PORT || "4000",
  MONGO_URI: process.env.MONGO_URI!,
  JWT_SECRET: process.env.JWT_SECRET!
};
