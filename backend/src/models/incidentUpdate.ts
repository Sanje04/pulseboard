import { Schema, model, Document, Types } from "mongoose";

export type IncidentUpdateType =
  | "COMMENT"
  | "STATUS_CHANGE"
  | "SEVERITY_CHANGE";

export interface IIncidentUpdate extends Document {
  projectId: Types.ObjectId;
  incidentId: Types.ObjectId;
  type: IncidentUpdateType;
  message: string;              // comment text or reason
  from?: string;                // previous value (status/severity)
  to?: string;                  // new value (status/severity)
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const incidentUpdateSchema = new Schema<IIncidentUpdate>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true, index: true },
    type: { type: String, enum: ["COMMENT", "STATUS_CHANGE", "SEVERITY_CHANGE"], required: true },
    message: { type: String, default: "" },
    from: { type: String },
    to: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

incidentUpdateSchema.index({ incidentId: 1, createdAt: -1 });

export const IncidentUpdate = model<IIncidentUpdate>("IncidentUpdate", incidentUpdateSchema);
