import { Response } from "express";
import { AuthRequest } from "../middleware/requireAuth";
import { AuditLog } from "../models/auditLog";

export const listAuditEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;

    const limitRaw = (req.query.limit as string) || "50";
    const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 50, 1), 200);

    const items = await AuditLog.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      items: items.map((e) => ({
        id: e._id,
        event: e.event,
        actorId: e.actorId,
        entityType: e.entityType,
        entityId: e.entityId,
        metadata: e.metadata,
        createdAt: e.createdAt
      }))
    });
  } catch (error) {
    console.error("List audit events error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
