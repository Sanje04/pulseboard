import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireProjectRole } from "../middleware/requireProjectRole";
import { createIncident, listIncidents, getIncident, deleteIncidentInProject } from "../controllers/incident.controller";
import { getIncidentInProject, updateIncidentInProject } from "../controllers/incident.controller";

const router = Router();

// project-scoped
router.post(
  "/projects/:projectId/incidents",
  requireAuth,
  requireProjectRole("MEMBER"),
  createIncident
);

router.get(
  "/projects/:projectId/incidents",
  requireAuth,
  requireProjectRole("VIEWER"),
  listIncidents
);

// incident-scoped (we'll add membership check by looking up incident.projectId later if needed)
router.get(
  "/incidents/:incidentId",
  requireAuth,
  getIncident
);

router.get(
  "/projects/:projectId/incidents/:incidentId",
  requireAuth,
  requireProjectRole("VIEWER"),
  getIncidentInProject
);

router.patch(
  "/projects/:projectId/incidents/:incidentId",
  requireAuth,
  requireProjectRole("MEMBER"),
  updateIncidentInProject
);

router.delete(
  "/projects/:projectId/incidents/:incidentId",
  requireAuth,
  requireProjectRole("MEMBER"),
  deleteIncidentInProject
);

export default router;
