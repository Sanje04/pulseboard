import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { createProject, listMyProjects, getProjectUsers } from "../controllers/project.controller";
import { requireProjectRole } from "../middleware/requireProjectRole";
import { inviteMember } from "../controllers/project.controller";


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
router.post(
  "/:projectId/invite",
  requireAuth,
  requireProjectRole("OWNER"),
  inviteMember
);

router.get(
  "/:projectId/users",
  requireAuth,
  requireProjectRole("VIEWER"),
  getProjectUsers
);

export default router;
