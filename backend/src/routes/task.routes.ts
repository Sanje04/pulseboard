import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { requireProjectRole } from "../middleware/requireProjectRole";
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask
} from "../controllers/task.controller";

const router = Router();

// Create a new task
router.post(
  "/projects/:projectId/tasks",
  requireAuth,
  requireProjectRole("MEMBER"),
  createTask
);

// List all tasks in a project
router.get(
  "/projects/:projectId/tasks",
  requireAuth,
  requireProjectRole("VIEWER"),
  listTasks
);

// Get a specific task
router.get(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  requireProjectRole("VIEWER"),
  getTask
);

// Update a task
router.patch(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  requireProjectRole("MEMBER"),
  updateTask
);

// Delete a task
router.delete(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  requireProjectRole("MEMBER"),
  deleteTask
);

export default router;
