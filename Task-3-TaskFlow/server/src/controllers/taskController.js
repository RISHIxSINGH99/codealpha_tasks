import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Comment from "../models/Comment.js";

/**
 * Helper: confirms the requesting user belongs to the project a task
 * is (or will be) attached to. Used across every task endpoint since
 * task access is always scoped through project membership.
 */
const ensureProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { project: null, allowed: false };
  return { project, allowed: project.isMember(userId) };
};

/**
 * @desc    Create a task inside a project
 * @route   POST /api/tasks
 * @access  Private (project members only)
 */
export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate, labels } = req.body;

    if (!title || !project) {
      return res.status(400).json({ success: false, message: "Title and project are required" });
    }

    const { project: projectDoc, allowed } = await ensureProjectAccess(project, req.user._id);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    // assignee, if provided, must also be a project member
    if (assignedTo && !projectDoc.isMember(assignedTo)) {
      return res.status(400).json({ success: false, message: "Assignee must be a member of the project" });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status,
      priority,
      dueDate,
      labels,
    });

    return res.status(201).json({ success: true, message: "Task created successfully", data: { task } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    return res.status(500).json({ success: false, message: "Server error while creating task" });
  }
};

/**
 * @desc    Get all tasks for a project (used to render the Kanban board)
 * @route   GET /api/tasks/project/:projectId
 * @access  Private (project members only)
 */
export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { allowed, project } = await ensureProjectAccess(projectId, req.user._id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .sort({ status: 1, order: 1, createdAt: -1 });

    return res.status(200).json({ success: true, count: tasks.length, data: { tasks } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while fetching tasks" });
  }
};

/**
 * @desc    Get a single task by ID, with its comments
 * @route   GET /api/tasks/:id
 * @access  Private (project members only)
 */
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("project", "name members owner");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!task.project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    const comments = await Comment.find({ task: task._id })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: { task, comments } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while fetching task" });
  }
};

/**
 * @desc    Update a task (title, description, assignee, priority, labels, dueDate)
 * @route   PUT /api/tasks/:id
 * @access  Private (project members only)
 */
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (!task.project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    const { title, description, assignedTo, priority, dueDate, labels } = req.body;

    if (assignedTo && !task.project.isMember(assignedTo)) {
      return res.status(400).json({ success: false, message: "Assignee must be a member of the project" });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (labels !== undefined) task.labels = labels;

    await task.save();

    return res.status(200).json({ success: true, message: "Task updated successfully", data: { task } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    return res.status(500).json({ success: false, message: "Server error while updating task" });
  }
};

/**
 * @desc    Update only a task's status/order - dedicated endpoint for
 *          drag-and-drop on the Kanban board (lighter payload, hot path).
 * @route   PATCH /api/tasks/:id/status
 * @access  Private (project members only)
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { status, order } = req.body;
    const validStatuses = ["todo", "in-progress", "review", "completed"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    const task = await Task.findById(req.params.id).populate("project");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (!task.project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    task.status = status;
    if (order !== undefined) task.order = order;
    await task.save();

    return res.status(200).json({ success: true, message: "Task status updated", data: { task } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while updating task status" });
  }
};

/**
 * @desc    Delete a task (and its comments)
 * @route   DELETE /api/tasks/:id
 * @access  Private (project members only)
 */
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (!task.project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    await Comment.deleteMany({ task: task._id });
    await task.deleteOne();

    return res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while deleting task" });
  }
};
