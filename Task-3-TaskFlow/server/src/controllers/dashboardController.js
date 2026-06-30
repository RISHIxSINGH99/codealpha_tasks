import Project from "../models/Project.js";
import Task from "../models/Task.js";

/**
 * @desc    Aggregated stats for the logged-in user's dashboard:
 *          project count, task counts by status, overdue tasks,
 *          and tasks assigned to the user.
 * @route   GET /api/dashboard
 * @access  Private
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      isArchived: false,
      $or: [{ owner: userId }, { "members.user": userId }],
    }).select("_id name");

    const projectIds = projects.map((p) => p._id);

    const [statusCounts, myTasks, overdueTasks] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.find({ assignedTo: userId, project: { $in: projectIds } })
        .populate("project", "name")
        .sort({ dueDate: 1 })
        .limit(10),
      Task.find({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: "completed" },
      })
        .populate("project", "name")
        .populate("assignedTo", "name avatar")
        .sort({ dueDate: 1 })
        .limit(10),
    ]);

    // normalize aggregate result into a flat { todo, in-progress, review, completed } object
    const tasksByStatus = { todo: 0, "in-progress": 0, review: 0, completed: 0 };
    statusCounts.forEach(({ _id, count }) => {
      if (_id in tasksByStatus) tasksByStatus[_id] = count;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalProjects: projects.length,
        tasksByStatus,
        myTasks,
        overdueTasks,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while building dashboard" });
  }
};
