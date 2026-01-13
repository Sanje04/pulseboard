import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { createProject, listMyProjects } from "../controllers/project.controller";

const router = Router();

router.post("/", requireAuth, createProject);
router.get("/", requireAuth, listMyProjects);

export default router;
