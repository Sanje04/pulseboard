import { Schema, model, Document, Types } from "mongoose";

// Define the types of incident updates
// this is used to track comments and changes to incidents
export type IncidentUpdateType =
  | "COMMENT"
  | "STATUS_CHANGE"
  | "SEVERITY_CHANGE"
  | "TITLE_CHANGE"
  | "DESCRIPTION_CHANGE"
  | "DELETED"
  | "CREATED";

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
    type: {
      type: String,
      enum: ["COMMENT", "STATUS_CHANGE", "SEVERITY_CHANGE", "TITLE_CHANGE", "DESCRIPTION_CHANGE", "DELETED", "CREATED"],
      required: true
    },
    message: { type: String, default: "" },
    from: { type: String },
    to: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

incidentUpdateSchema.index({ incidentId: 1, createdAt: -1 });

export const IncidentUpdate = model<IIncidentUpdate>("IncidentUpdate", incidentUpdateSchema);
