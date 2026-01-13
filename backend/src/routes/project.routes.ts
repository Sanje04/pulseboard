import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { createProject, listMyProjects } from "../controllers/project.controller";
import { requireProjectRole } from "../middleware/requireProjectRole";

const router = Router();

// Create a new project
router.post("/", requireAuth, createProject);
// List projects for the authenticated user
router.get("/", requireAuth, listMyProjects);
// Example of a protected route requiring MEMBER role
router.get(
  "/:projectId/members-only",
  requireAuth,
  requireProjectRole("MEMBER"),
  (req, res) => res.json({ ok: true })
);

export default router;
