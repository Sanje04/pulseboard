import { Schema, model, Document, Types } from "mongoose";

export type AuditEvent =
  | "INCIDENT_CREATED"
  | "INCIDENT_COMMENT_ADDED"
  | "INCIDENT_STATUS_CHANGED"
  | "INCIDENT_SEVERITY_CHANGED";

export interface IAuditLog extends Document {
  projectId: Types.ObjectId;
  actorId: Types.ObjectId;
  event: AuditEvent;
  entityType: "INCIDENT";
  entityId: Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: {
      type: String,
      enum: [
        "INCIDENT_CREATED",
        "INCIDENT_COMMENT_ADDED",
        "INCIDENT_STATUS_CHANGED",
        "INCIDENT_SEVERITY_CHANGED"
      ],
      required: true
    },
    entityType: { type: String, enum: ["INCIDENT"], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ projectId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
