import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireProjectRole } from "../middleware/requireProjectRole";
import {
  addIncidentComment,
  changeIncidentStatus,
  getIncidentTimeline
} from "../controllers/incidentUpdate.controller";

const router = Router();

router.post(
  "/projects/:projectId/incidents/:incidentId/comments",
  requireAuth,
  requireProjectRole("MEMBER"),
  addIncidentComment
);

router.patch(
  "/projects/:projectId/incidents/:incidentId/status",
  requireAuth,
  requireProjectRole("MEMBER"),
  changeIncidentStatus
);

router.get(
  "/projects/:projectId/incidents/:incidentId/timeline",
  requireAuth,
  requireProjectRole("VIEWER"),
  getIncidentTimeline
);

export default router;
