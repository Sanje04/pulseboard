import { Response } from "express";
import { AuthRequest } from "../middleware/requireAuth";
import { Incident } from "../models/incident";
import { IncidentUpdate } from "../models/incidentUpdate";
import { AuditLog } from "../models/auditLog";

export const addIncidentComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, incidentId } = req.params;
    const { message } = req.body as { message?: string };

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const incident = await Incident.findOne({ _id: incidentId, projectId, deletedAt: null }).lean();
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    const update = await IncidentUpdate.create({
      projectId,
      incidentId,
      type: "COMMENT",
      message: message.trim(),
      createdBy: req.userId
    });

    await AuditLog.create({
      projectId,
      actorId: req.userId,
      event: "INCIDENT_COMMENT_ADDED",
      entityType: "INCIDENT",
      entityId: incidentId,
      metadata: { messagePreview: message.trim().slice(0, 80) }
    });

    return res.status(201).json({
      update: {
        id: update._id,
        type: update.type,
        message: update.message,
        createdBy: update.createdBy,
        createdAt: update.createdAt
      }
    });
  } catch (e) {
    console.error("Add comment error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const changeIncidentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, incidentId } = req.params;
    const { status, message } = req.body as { status?: string; message?: string };

    if (!status || !["OPEN", "MITIGATING", "RESOLVED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const incident = await Incident.findOne({ _id: incidentId, projectId, deletedAt: null });
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    const from = incident.status;
    const to = status;

    if (from === to) {
      return res.status(400).json({ error: "Status is already set to that value" });
    }

    incident.status = to as any;
    await incident.save();

    const update = await IncidentUpdate.create({
      projectId,
      incidentId,
      type: "STATUS_CHANGE",
      message: typeof message === "string" ? message.trim() : "",
      from,
      to,
      createdBy: req.userId
    });

    await AuditLog.create({
      projectId,
      actorId: req.userId,
      event: "INCIDENT_STATUS_CHANGED",
      entityType: "INCIDENT",
      entityId: incidentId,
      metadata: { from, to }
    });

    return res.json({
      incident: {
        id: incident._id,
        status: incident.status,
        updatedAt: incident.updatedAt
      },
      update: {
        id: update._id,
        type: update.type,
        from: update.from,
        to: update.to,
        message: update.message,
        createdAt: update.createdAt
      }
    });
  } catch (e) {
    console.error("Change status error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getIncidentTimeline = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, incidentId } = req.params;

    const incident = await Incident.findOne({ _id: incidentId, projectId, deletedAt: null }).lean();
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    const updates = await IncidentUpdate.find({ projectId, incidentId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      items: updates.map((u) => ({
        id: u._id,
        type: u.type,
        message: u.message,
        from: u.from,
        to: u.to,
        createdBy: u.createdBy,
        createdAt: u.createdAt
      }))
    });
  } catch (e) {
    console.error("Get timeline error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

