import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import {
  createProject,
  listMyProjects,
  getProjectUsers,
  inviteMember,
  deleteProject,
  updateProject,
  leaveProject,
  declineProjectInvite,
  acceptProjectInvite
} from "../controllers/project.controller";
import { requireProjectRole } from "../middleware/requireProjectRole";

const router = Router();

// Create a new project
router.post("/", requireAuth, createProject);

// List projects for the authenticated user, including their role per project
router.get("/", requireAuth, listMyProjects);

// Example of a protected route requiring MEMBER role
router.get(
  "/:projectId/members-only",
  requireAuth,
  requireProjectRole("MEMBER"),
  (req, res) => res.json({ ok: true })
);

// Add / invite a user to a project
// Authorization is enforced inside the controller via getUserProjectRole
router.post("/:projectId/invite", requireAuth, inviteMember);
router.post("/:projectId/users", requireAuth, inviteMember);

// List project users (members)
router.get(
  "/:projectId/users",
  requireAuth,
  requireProjectRole("VIEWER"),
  getProjectUsers
);

// Delete a project (OWNER only)
router.delete("/:projectId", requireAuth, deleteProject);

// Update a project (OWNER or MANAGER)
router.patch("/:projectId", requireAuth, updateProject);

// Leave a project (MANAGER, MEMBER, VIEWER can leave; OWNER can leave if not the only owner)
router.post("/:projectId/leave", requireAuth, leaveProject);

// Accept a project invite
router.post("/:projectId/accept", requireAuth, acceptProjectInvite);

// Decline a project invite
router.post("/:projectId/decline", requireAuth, declineProjectInvite);

export default router;
