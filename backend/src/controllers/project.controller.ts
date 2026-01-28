import { User } from "../models/user"; // ensure correct path
import { Membership, Role } from "../models/membership";
import { Project } from "../models/project";
import { AuthRequest } from "../middleware/requireAuth";
import { Response } from "express";

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

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { email, role } = req.body as { email?: string; role?: Role };

    if (!projectId) return res.status(400).json({ error: "Missing projectId" });
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Optional: validate role
    const inviteRole: Role = role ?? "VIEWER";
    if (!["OWNER", "MEMBER", "VIEWER"].includes(inviteRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Ensure project exists (nice-to-have)
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Find invited user
    const invitedUser = await User.findOne({ email: normalizedEmail }).select("_id name email");
    if (!invitedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create membership (unique index prevents duplicates)
    const membership = await Membership.create({
      projectId,
      userId: invitedUser._id,
      role: inviteRole
    });

    return res.status(201).json({
      membership: {
        id: membership._id,
        projectId: membership.projectId,
        userId: membership.userId,
        role: membership.role
      }
    });
  } catch (error: any) {
    // Handle duplicate membership nicely
    if (error?.code === 11000) {
      return res.status(409).json({ error: "User is already a member of this project" });
    }
    console.error("Invite member error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getProjectUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;

    // Fetch all memberships for this project and populate user details
    const memberships = await Membership.find({ projectId })
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: 1 })
      .lean();

    return res.json(
      memberships.map((m: any) => {
        // Split name into firstName and lastName (simple approach)
        const nameParts = m.userId.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Map our role to the expected frontend role
        // OWNER -> admin, MEMBER -> manager, VIEWER -> cashier
        const roleMap: Record<string, string> = {
          'OWNER': 'admin',
          'MEMBER': 'manager',
          'VIEWER': 'cashier'
        };

        return {
          id: m.userId._id,
          firstName,
          lastName,
          username: m.userId.email.split('@')[0], // Use email prefix as username
          email: m.userId.email,
          phoneNumber: '', // We don't have phone numbers
          status: 'active', // Default to active
          role: roleMap[m.role] || 'cashier',
          createdAt: m.createdAt,
          updatedAt: m.createdAt // Use same as createdAt since we don't track updates
        };
      })
    );
  } catch (error) {
    console.error("Get project users error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};