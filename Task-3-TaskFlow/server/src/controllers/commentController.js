import Comment from "../models/Comment.js";
import Task from "../models/Task.js";

/**
 * @desc    Add a comment to a task
 * @route   POST /api/comments
 * @access  Private (project members only)
 */
export const addComment = async (req, res) => {
  try {
    const { task: taskId, text } = req.body;

    if (!taskId || !text) {
      return res.status(400).json({ success: false, message: "Task ID and comment text are required" });
    }

    const task = await Task.findById(taskId).populate("project");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (!task.project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    const comment = await Comment.create({ task: taskId, author: req.user._id, text });
    const populatedComment = await comment.populate("author", "name email avatar");

    return res.status(201).json({ success: true, message: "Comment added successfully", data: { comment: populatedComment } });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    return res.status(500).json({ success: false, message: "Server error while adding comment" });
  }
};

/**
 * @desc    Get all comments for a task
 * @route   GET /api/comments/task/:taskId
 * @access  Private (project members only)
 */
export const getCommentsByTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate("project");
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    if (!task.project.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied: not a project member" });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, count: comments.length, data: { comments } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while fetching comments" });
  }
};

/**
 * @desc    Delete a comment (author only)
 * @route   DELETE /api/comments/:id
 * @access  Private (comment author only)
 */
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied: you can only delete your own comments" });
    }

    await comment.deleteOne();

    return res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while deleting comment" });
  }
};
