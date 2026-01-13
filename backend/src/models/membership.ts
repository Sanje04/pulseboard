import { Schema, model, Document, Types } from "mongoose";

export type Role = "OWNER" | "MEMBER" | "VIEWER";

export interface IMembership extends Document {
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  role: Role;
  createdAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["OWNER", "MEMBER", "VIEWER"], required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate membership rows
membershipSchema.index({ projectId: 1, userId: 1 }, { unique: true });
// Helpful for listing user’s projects
membershipSchema.index({ userId: 1 });

export const Membership = model<IMembership>("Membership", membershipSchema);
