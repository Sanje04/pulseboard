import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireProjectRole } from "../middleware/requireProjectRole";
import { listAuditEvents } from "../controllers/audit.controller";

const router = Router();

router.get(
  "/projects/:projectId/audit",
  requireAuth,
  requireProjectRole("VIEWER"),
  listAuditEvents
);

export default router;
