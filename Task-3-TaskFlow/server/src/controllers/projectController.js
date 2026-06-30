import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

/**
 * @desc    Create a new project. Creator is automatically the owner.
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Project name is required" });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [],
    });

    return res.status(201).json({ success: true, message: "Project created successfully", data: { project } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    return res.status(500).json({ success: false, message: "Server error while creating project" });
  }
};

/**
 * @desc    Get all projects the logged-in user owns or is a member of
 * @route   GET /api/projects
 * @access  Private
 */
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      isArchived: false,
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, count: projects.length, data: { projects } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while fetching projects" });
  }
};

/**
 * @desc    Get a single project by ID
 * @route   GET /api/projects/:id
 * @access  Private (members only)
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    return res.status(200).json({ success: true, data: { project } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while fetching project" });
  }
};

/**
 * @desc    Update project details (name/description)
 * @route   PUT /api/projects/:id
 * @access  Private (owner/admin - enforced by requireProjectRole middleware)
 */
export const updateProject = async (req, res) => {
  try {
    const { name, description, isArchived } = req.body;
    const project = req.project; // attached by requireProjectRole middleware

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (isArchived !== undefined) project.isArchived = Boolean(isArchived);

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    return res.status(200).json({ success: true, message: "Project updated successfully", data: { project: updatedProject } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    return res.status(500).json({ success: false, message: "Server error while updating project" });
  }
};

/**
 * @desc    Delete a project (and cascade-delete its tasks + comments)
 * @route   DELETE /api/projects/:id
 * @access  Private (owner only - enforced by requireProjectRole middleware)
 */
export const deleteProject = async (req, res) => {
  try {
    const project = req.project;

    const tasks = await Task.find({ project: project._id }).select("_id");
    const taskIds = tasks.map((t) => t._id);

    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    return res.status(200).json({ success: true, message: "Project and related data deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while deleting project" });
  }
};

/**
 * @desc    Invite (add) a member to a project by email
 * @route   POST /api/projects/:id/invite
 * @access  Private (owner/admin - enforced by requireProjectRole middleware)
 */
export const inviteMember = async (req, res) => {
  try {
    const { email, role = "member" } = req.body;
    const project = req.project;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required to invite a member" });
    }

    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      return res.status(404).json({ success: false, message: "No user found with that email" });
    }

    if (project.isMember(userToInvite._id)) {
      return res.status(409).json({ success: false, message: "User is already a member of this project" });
    }

    project.members.push({ user: userToInvite._id, role });
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Member invited successfully",
      data: { project: updatedProject },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while inviting member" });
  }
};

/**
 * @desc    Remove a member from a project
 * @route   DELETE /api/projects/:id/members/:memberId
 * @access  Private (owner/admin - enforced by requireProjectRole middleware)
 */
export const removeMember = async (req, res) => {
  try {
    const project = req.project;
    const { memberId } = req.params;

    if (project.owner.toString() === memberId) {
      return res.status(400).json({ success: false, message: "Cannot remove the project owner" });
    }

    project.members = project.members.filter((m) => m.user.toString() !== memberId);
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    return res.status(200).json({ success: true, message: "Member removed successfully", data: { project: updatedProject } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while removing member" });
  }
};
