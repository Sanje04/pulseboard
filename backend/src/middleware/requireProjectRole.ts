import { Response, NextFunction } from "express";
import { AuthRequest } from "./requireAuth";
import { Role } from "../models/membership";
import { getUserProjectRole } from "../services/project.service";

const roleRank: Record<Role, number> = {
  VIEWER: 1,
  MEMBER: 2,
  MANAGER: 3,
  OWNER: 4
};

export const requireProjectRole =
  (minRole: Role) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { projectId } = req.params;
      if (!projectId) {
        return res.status(400).json({ error: "Missing projectId" });
      }

      const role = await getUserProjectRole(req.userId, projectId);

      if (!role) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const userRank = roleRank[role];
      const requiredRank = roleRank[minRole];

      if (userRank < requiredRank) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return next();
    } catch (error) {
      console.error("requireProjectRole error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
