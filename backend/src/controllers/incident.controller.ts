import { Response } from "express";
import { AuthRequest } from "../middleware/requireAuth";
import { Incident, IncidentSeverity, IncidentStatus } from "../models/incident";
import { IncidentUpdate } from "../models/incidentUpdate";
import { AuditLog } from "../models/auditLog";

export const createIncident = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { title, description, severity } = req.body as {
      title: string;
      description?: string;
      severity: IncidentSeverity;
    };

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!severity || !["SEV1", "SEV2", "SEV3", "SEV4"].includes(severity)) {
      return res.status(400).json({ error: "Valid severity is required" });
    }

    const incident = await Incident.create({
      projectId,
      title: title.trim(),
      description: description || "",
      severity,
      status: "INVESTIGATING",
      createdBy: req.userId
    });

    await Promise.all([
      IncidentUpdate.create({
        projectId,
        incidentId: incident._id,
        type: "CREATED",
        message: "Incident created",
        createdBy: req.userId
      }),
      AuditLog.create({
        projectId,
        actorId: req.userId,
        event: "INCIDENT_CREATED",
        entityType: "INCIDENT",
        entityId: incident._id,
        metadata: { title: incident.title, severity: incident.severity }
      })
    ]);

    return res.status(201).json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt
      }
    });
  } catch (error) {
    console.error("Create incident error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listIncidents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { status } = req.query;

    const filter: any = { projectId, deletedAt: null };
    if (status && typeof status === "string") {
      filter.status = status;
    }

    const incidents = await Incident.find(filter).sort({ createdAt: -1 });

    return res.json({
      incidents: incidents.map((inc) => ({
        id: inc._id,
        projectId: inc.projectId,
        title: inc.title,
        description: inc.description,
        severity: inc.severity,
        status: inc.status,
        createdAt: inc.createdAt,
        updatedAt: inc.updatedAt
      }))
    });
  } catch (error) {
    console.error("List incidents error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getIncident = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { incidentId } = req.params;

    const incident = await Incident.findOne({ _id: incidentId, deletedAt: null });
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    return res.json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt
      }
    });
  } catch (error) {
    console.error("Get incident error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getIncidentInProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, incidentId } = req.params;

    const incident = await Incident.findOne({
      _id: incidentId,
      projectId,
      deletedAt: null
    });

    if (!incident) return res.status(404).json({ error: "Incident not found" });

    return res.json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt
      }
    });
  } catch (error) {
    console.error("Get incident in project error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateIncidentInProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, incidentId } = req.params;
    const { title, description, severity } = req.body as {
      title?: string;
      description?: string;
      severity?: IncidentSeverity;
    };

    const incident = await Incident.findOne({
      _id: incidentId,
      projectId,
      deletedAt: null
    });

    if (!incident) return res.status(404).json({ error: "Incident not found" });

    // Snapshot old values for diffing
    const before = {
      title: incident.title,
      description: incident.description ?? "",
      severity: incident.severity
    };

    // Apply changes (validate along the way)
    let changed = false;

    if (typeof title === "string") {
      const trimmed = title.trim();
      if (!trimmed) return res.status(400).json({ error: "Title cannot be empty" });
      if (trimmed !== incident.title) {
        incident.title = trimmed;
        changed = true;
      }
    }

    if (typeof description === "string") {
      if (description !== (incident.description ?? "")) {
        incident.description = description;
        changed = true;
      }
    }

    if (typeof severity === "string") {
      if (!["SEV1", "SEV2", "SEV3", "SEV4"].includes(severity)) {
        return res.status(400).json({ error: "Invalid severity" });
      }
      if (severity !== incident.severity) {
        incident.severity = severity;
        changed = true;
      }
    }

    if (!changed) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Save incident once
    await incident.save();

    // Compute after values
    const after = {
      title: incident.title,
      description: incident.description ?? "",
      severity: incident.severity
    };

    // Build timeline updates + audit events for each changed field
    const updatesToCreate: any[] = [];
    const auditsToCreate: any[] = [];

    if (before.title !== after.title) {
      updatesToCreate.push({
        projectId,
        incidentId,
        type: "TITLE_CHANGE",
        message: "",
        from: before.title,
        to: after.title,
        createdBy: req.userId
      });

      auditsToCreate.push({
        projectId,
        actorId: req.userId,
        event: "INCIDENT_TITLE_CHANGED",
        entityType: "INCIDENT",
        entityId: incidentId,
        metadata: { from: before.title, to: after.title }
      });
    }

    if (before.description !== after.description) {
      updatesToCreate.push({
        projectId,
        incidentId,
        type: "DESCRIPTION_CHANGE",
        message: after.description.slice(0, 120), // Preview of new description
        from: String(before.description.length),   // Store length instead of full text
        to: String(after.description.length),      // Store length instead of full text
        createdBy: req.userId
      });

      auditsToCreate.push({
        projectId,
        actorId: req.userId,
        event: "INCIDENT_DESCRIPTION_CHANGED",
        entityType: "INCIDENT",
        entityId: incidentId,
        metadata: {
          fromLen: before.description.length,
          toLen: after.description.length,
          toPreview: after.description.slice(0, 80)
        }
      });
    }

    if (before.severity !== after.severity) {
      updatesToCreate.push({
        projectId,
        incidentId,
        type: "SEVERITY_CHANGE",
        message: "",
        from: before.severity,
        to: after.severity,
        createdBy: req.userId
      });

      auditsToCreate.push({
        projectId,
        actorId: req.userId,
        event: "INCIDENT_SEVERITY_CHANGED",
        entityType: "INCIDENT",
        entityId: incidentId,
        metadata: { from: before.severity, to: after.severity }
      });
    }

    const [createdUpdates] = await Promise.all([
      updatesToCreate.length ? IncidentUpdate.insertMany(updatesToCreate) : Promise.resolve([]),
      auditsToCreate.length ? AuditLog.insertMany(auditsToCreate) : Promise.resolve([])
    ]);

    return res.json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        updatedAt: incident.updatedAt
      },
      updates: (createdUpdates as any[]).map((u) => ({
        id: u._id,
        type: u.type,
        from: u.from,
        to: u.to,
        message: u.message,
        createdBy: u.createdBy,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error("Update incident (project-scoped) error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
