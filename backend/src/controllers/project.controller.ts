import { User } from "../models/user";
import { Membership, Role } from "../models/membership";
import { Project } from "../models/project";
import { AuthRequest } from "../middleware/requireAuth";
import { Response } from "express";
import { getUserProjectRole } from "../services/project.service";

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
      .select("projectId role status")
      .lean();

    const projectIds = memberships.map((m) => m.projectId);

    const projects = await Project.find({ _id: { $in: projectIds } })
      .sort({ createdAt: -1 })
      .lean();

    const membershipDataByProjectId = new Map(
      memberships.map((m) => [
        m.projectId.toString(),
        { role: m.role, status: m.status || "active" }
      ])
    );

    return res.json({
      items: projects.map((p) => {
        const membershipData = membershipDataByProjectId.get(p._id.toString());
        return {
          id: p._id,
          name: p.name,
          description: p.description,
          // Effective project role for the current user (lowercase for frontend)
          role: membershipData?.role.toLowerCase(),
          // Membership status: ACTIVE or INVITED
          membershipStatus: membershipData?.status.toUpperCase()
        };
      })
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
    const { email, role, message } = req.body as { email?: string; role?: Role; message?: string };

    if (!projectId) return res.status(400).json({ error: "Missing projectId" });
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate role for the invited user; default to VIEWER
    // Accept both lowercase and uppercase from frontend
    const roleUpper = (role?.toUpperCase() ?? "VIEWER") as Role;
    if (!["OWNER", "MANAGER", "MEMBER", "VIEWER"].includes(roleUpper)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const inviteRole: Role = roleUpper;

    // Ensure project exists
    const projectExists = await Project.exists({ _id: projectId });
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Authorization: only project OWNER or MANAGER can add users
    const currentRole = await getUserProjectRole(req.userId, projectId);
    if (!currentRole || !["OWNER", "MANAGER"].includes(currentRole)) {
      return res.status(403).json({
        message: "Only project owners and managers can add users."
      });
    }

    // Find or create invited user
    let invitedUser = await User.findOne({ email: normalizedEmail }).select("_id name email");
    
    if (!invitedUser) {
      // Create new user with email as temporary name
      // They can update their profile later when they accept the invite
      invitedUser = await User.create({
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        passwordHash: "" // Empty password hash - user must set password on first login
      });
    }

    // Create membership with "invited" status (unique index prevents duplicates)
    const membership = await Membership.create({
      projectId,
      userId: invitedUser._id,
      role: inviteRole,
      status: "invited",
      inviteMessage: message?.trim() || undefined
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
        const nameParts = m.userId.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Expose the project role in lowercase format for frontend
        // Role is one of: owner | manager | member | viewer
        return {
          id: m.userId._id,
          firstName,
          lastName,
          username: m.userId.email.split("@")[0],
          email: m.userId.email,
          phoneNumber: "",
          status: m.status || "active",
          role: m.role.toLowerCase(),
          inviteMessage: m.inviteMessage || undefined,
          createdAt: m.createdAt,
          updatedAt: m.createdAt
        };
      })
    );
  } catch (error) {
    console.error("Get project users error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Authorization: only OWNER can delete the project
    const currentRole = await getUserProjectRole(req.userId, projectId);
    if (currentRole !== "OWNER") {
      return res.status(403).json({
        message: "Only project owners can delete the project."
      });
    }

    // Delete all memberships for this project
    await Membership.deleteMany({ projectId });

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    return res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;
    const { name, description } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Authorization: only OWNER or MANAGER can update the project
    const currentRole = await getUserProjectRole(req.userId, projectId);
    if (!currentRole || !["OWNER", "MANAGER"].includes(currentRole)) {
      return res.status(403).json({
        message: "Only project owners and managers can update the project."
      });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Project name must be a non-empty string" });
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = typeof description === "string" ? description : "";
    }

    await project.save();

    return res.json({
      id: project._id,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get current user's role
    const currentRole = await getUserProjectRole(req.userId, projectId);
    if (!currentRole) {
      return res.status(403).json({ error: "You are not a member of this project" });
    }

    // OWNER cannot leave if they are the only owner
    if (currentRole === "OWNER") {
      const ownerCount = await Membership.countDocuments({
        projectId,
        role: "OWNER"
      });

      if (ownerCount <= 1) {
        return res.status(403).json({
          message: "Cannot leave project. You are the only owner. Please delete the project or transfer ownership first."
        });
      }
    }

    // Remove membership
    await Membership.deleteOne({ projectId, userId: req.userId });

    return res.json({ message: "Successfully left the project" });
  } catch (error) {
    console.error("Leave project error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const declineProjectInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;

    // Find the membership with "invited" status
    const membership = await Membership.findOne({
      projectId,
      userId: req.userId,
      status: "invited"
    });

    if (!membership) {
      return res.status(404).json({ error: "No pending invite found for this project" });
    }

    // Remove the invited membership
    await Membership.deleteOne({ _id: membership._id });

    return res.json({ message: "Project invite declined successfully" });
  } catch (error) {
    console.error("Decline project invite error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const acceptProjectInvite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { projectId } = req.params;

    // Find the membership with "invited" status
    const membership = await Membership.findOne({
      projectId,
      userId: req.userId,
      status: "invited"
    });

    if (!membership) {
      return res.status(404).json({ error: "No pending invite found for this project" });
    }

    // Update status to active
    membership.status = "active";
    await membership.save();

    return res.json({ message: "Project invite accepted successfully" });
  } catch (error) {
    console.error("Accept project invite error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};