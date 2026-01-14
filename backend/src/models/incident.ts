import { Schema, model, Document, Types } from "mongoose";

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export type IncidentStatus = "OPEN" | "MITIGATING" | "RESOLVED";

export interface IIncident extends Document {
  projectId: Types.ObjectId;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const incidentSchema = new Schema<IIncident>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    severity: { type: String, enum: ["SEV1", "SEV2", "SEV3", "SEV4"], required: true },
    status: { type: String, enum: ["OPEN", "MITIGATING", "RESOLVED"], default: "OPEN" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// helpful list queries
incidentSchema.index({ projectId: 1, createdAt: -1 });
incidentSchema.index({ projectId: 1, status: 1, createdAt: -1 });
incidentSchema.index({ projectId: 1, severity: 1, createdAt: -1 });

export const Incident = model<IIncident>("Incident", incidentSchema);
