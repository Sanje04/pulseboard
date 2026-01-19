import { Response } from "express";
import { AuthRequest } from "../middleware/requireAuth";
import { Incident, IncidentSeverity, IncidentStatus } from "../models/incident";

export const createIncident = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { title, description, severity } = req.body as {
      title?: string;
      description?: string;
      severity?: IncidentSeverity;
    };

    if (!projectId) return res.status(400).json({ error: "Missing projectId" });
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!severity || !["SEV1", "SEV2", "SEV3", "SEV4"].includes(severity)) {
      return res.status(400).json({ error: "Invalid severity" });
    }

    const incident = await Incident.create({
      projectId,
      title: title.trim(),
      description: typeof description === "string" ? description : "",
      severity,
      status: "OPEN" as IncidentStatus,
      createdBy: req.userId
    });

    return res.status(201).json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdBy: incident.createdBy,
        createdAt: incident.createdAt
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
    if (!projectId) return res.status(400).json({ error: "Missing projectId" });

    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;

    const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "20", 10), 1), 100);
    const skip = (page - 1) * limit;

    const filter: any = { projectId, deletedAt: null };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const [items, total] = await Promise.all([
      Incident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Incident.countDocuments(filter)
    ]);

    return res.json({
      items: items.map((i) => ({
        id: i._id,
        projectId: i.projectId,
        title: i.title,
        description: i.description,
        severity: i.severity,
        status: i.status,
        createdAt: i.createdAt
      })),
      page,
      limit,
      total
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
    if (!incidentId) return res.status(400).json({ error: "Missing incidentId" });

    const incident = await Incident.findById(incidentId).lean();
    if (!incident || incident.deletedAt) {
      return res.status(404).json({ error: "Incident not found" });
    }

    return res.json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdBy: incident.createdBy,
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
    }).lean();

    if (!incident) return res.status(404).json({ error: "Incident not found" });

    return res.json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        createdBy: incident.createdBy,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt
      }
    });
  } catch (error) {
    console.error("Get incident (project-scoped) error:", error);
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

    let changed = false;

    if (typeof title === "string") {
      const trimmed = title.trim();
      if (!trimmed) return res.status(400).json({ error: "Title cannot be empty" });
      incident.title = trimmed;
      changed = true;
    }

    if (typeof description === "string") {
      incident.description = description;
      changed = true;
    }

    if (typeof severity === "string") {
      if (!["SEV1", "SEV2", "SEV3", "SEV4"].includes(severity)) {
        return res.status(400).json({ error: "Invalid severity" });
      }
      incident.severity = severity;
      changed = true;
    }

    if (!changed) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await incident.save();

    return res.json({
      incident: {
        id: incident._id,
        projectId: incident.projectId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        updatedAt: incident.updatedAt
      }
    });
  } catch (error) {
    console.error("Update incident (project-scoped) error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
