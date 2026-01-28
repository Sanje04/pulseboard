import { Schema, model, Document, Types } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BACKLOG" | "CANCELLED" | "DONE";
export type TaskLabel = "DOCUMENTATION" | "FEATURE" | "BUG";
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

export interface ITask extends Document {
  projectId: Types.ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  label: TaskLabel;
  priority: TaskPriority;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { 
      type: String, 
      enum: ["TODO", "IN_PROGRESS", "BACKLOG", "CANCELLED", "DONE"], 
      default: "TODO" 
    },
    label: { 
      type: String, 
      enum: ["DOCUMENTATION", "FEATURE", "BUG"], 
      required: true 
    },
    priority: { 
      type: String, 
      enum: ["HIGH", "MEDIUM", "LOW"], 
      default: "MEDIUM" 
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Indexes for efficient queries
taskSchema.index({ projectId: 1, createdAt: -1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, label: 1 });
taskSchema.index({ projectId: 1, priority: 1 });

export const Task = model<ITask>("Task", taskSchema);
