import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/requireAuth";
import { Project } from "../models/project";
import { Membership } from "../models/membership";

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const project = await Project.create({
      name: name.trim(),
      description: typeof description === "string" ? description : "",
      createdBy: req.userId
    });

    await Membership.create({
      projectId: project._id,
      userId: req.userId,
      role: "OWNER"
    });

    return res.status(201).json({
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        createdBy: project.createdBy,
        createdAt: project.createdAt
      }
    });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listMyProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const memberships = await Membership.find({ userId: req.userId })
      .select("projectId role")
      .lean();

    const projectIds = memberships.map((m) => m.projectId);

    const projects = await Project.find({ _id: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .lean();

    const roleByProjectId = new Map(
      memberships.map((m) => [m.projectId.toString(), m.role])
    );

    return res.json({
      items: projects.map((p) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        role: roleByProjectId.get(p._id.toString())
      }))
    });
  } catch (error) {
    console.error("List projects error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
