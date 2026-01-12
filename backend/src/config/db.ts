import mongoose from "mongoose";
import { env } from "./env";

// Function to connect to MongoDB using Mongoose
export const connectDB = async () => {
  await mongoose.connect(env.MONGO_URI);
  console.log("MongoDB connected");
};