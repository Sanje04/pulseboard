import { Response } from "express";
import { AuthRequest } from "../middleware/requireAuth";
import { Task, TaskStatus, TaskLabel, TaskPriority } from "../models/task";
import { AuditLog } from "../models/auditLog";

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { title, description, label, priority, status } = req.body as {
      title: string;
      description?: string;
      label: TaskLabel;
      priority?: TaskPriority;
      status?: TaskStatus;
    };

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!label || typeof label !== "string") {
      return res.status(400).json({ error: "Label is required" });
    }

    // Normalize label to uppercase
    const normalizedLabel = label.toUpperCase() as TaskLabel;
    if (!["DOCUMENTATION", "FEATURE", "BUG"].includes(normalizedLabel)) {
      return res.status(400).json({ error: "Valid label is required" });
    }

    // Normalize priority if provided
    let normalizedPriority: TaskPriority = "MEDIUM";
    if (priority) {
      normalizedPriority = priority.toUpperCase() as TaskPriority;
      if (!["HIGH", "MEDIUM", "LOW"].includes(normalizedPriority)) {
        normalizedPriority = "MEDIUM";
      }
    }

    // Normalize status if provided
    let normalizedStatus: TaskStatus = "TODO";
    if (status) {
      normalizedStatus = status.toUpperCase() as TaskStatus;
      if (!["TODO", "IN_PROGRESS", "BACKLOG", "CANCELLED", "DONE"].includes(normalizedStatus)) {
        normalizedStatus = "TODO";
      }
    }

    const task = await Task.create({
      projectId,
      title: title.trim(),
      description: description || "",
      label: normalizedLabel,
      priority: normalizedPriority,
      status: normalizedStatus,
      createdBy: req.userId
    });

    return res.status(201).json({
      task: {
        id: task._id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        label: task.label,
        priority: task.priority,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error("Create task error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const listTasks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { status, label, priority } = req.query;

    const filter: any = { projectId, deletedAt: null };
    
    if (status && typeof status === "string") {
      filter.status = status;
    }
    if (label && typeof label === "string") {
      filter.label = label;
    }
    if (priority && typeof priority === "string") {
      filter.priority = priority;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    return res.json(
      tasks.map((task) => ({
        id: task._id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        label: task.label,
        priority: task.priority,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    );
  } catch (error) {
    console.error("List tasks error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      projectId,
      deletedAt: null
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    return res.json({
      task: {
        id: task._id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        label: task.label,
        priority: task.priority,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error("Get task error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, taskId } = req.params;
    const { title, description, status, label, priority } = req.body as {
      title?: string;
      description?: string;
      status?: TaskStatus;
      label?: TaskLabel;
      priority?: TaskPriority;
    };

    const task = await Task.findOne({
      _id: taskId,
      projectId,
      deletedAt: null
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    let changed = false;

    if (typeof title === "string") {
      const trimmed = title.trim();
      if (!trimmed) return res.status(400).json({ error: "Title cannot be empty" });
      if (trimmed !== task.title) {
        task.title = trimmed;
        changed = true;
      }
    }

    if (typeof description === "string" && description !== task.description) {
      task.description = description;
      changed = true;
    }

    if (typeof status === "string") {
      if (!["TODO", "IN_PROGRESS", "BACKLOG", "CANCELLED", "DONE"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      if (status !== task.status) {
        task.status = status;
        changed = true;
      }
    }

    if (typeof label === "string") {
      if (!["DOCUMENTATION", "FEATURE", "BUG"].includes(label)) {
        return res.status(400).json({ error: "Invalid label" });
      }
      if (label !== task.label) {
        task.label = label;
        changed = true;
      }
    }

    if (typeof priority === "string") {
      if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }
      if (priority !== task.priority) {
        task.priority = priority;
        changed = true;
      }
    }

    if (!changed) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await task.save();

    return res.json({
      task: {
        id: task._id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        label: task.label,
        priority: task.priority,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error("Update task error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId, taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      projectId,
      deletedAt: null
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    task.deletedAt = new Date();
    await task.save();

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
