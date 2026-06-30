import Project from "../models/Project.js";
import Task from "../models/Task.js";

/**
 * @desc    Search projects and tasks the user has access to, by keyword.
 * @route   GET /api/search?q=keyword
 * @access  Private
 */
export const search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Search query 'q' is required" });
    }

    const userId = req.user._id;

    const accessibleProjects = await Project.find({
      isArchived: false,
      $or: [{ owner: userId }, { "members.user": userId }],
    }).select("_id");
    const projectIds = accessibleProjects.map((p) => p._id);

    const [projects, tasks] = await Promise.all([
      Project.find({
        _id: { $in: projectIds },
        name: { $regex: q, $options: "i" },
      }).select("name description"),
      Task.find({
        project: { $in: projectIds },
        $text: { $search: q },
      })
        .populate("project", "name")
        .populate("assignedTo", "name avatar")
        .limit(20),
    ]);

    return res.status(200).json({
      success: true,
      data: { projects, tasks },
    });
  } catch (error) {
    // $text search throws if no text index matches the query syntax (rare); fall back gracefully
    return res.status(500).json({ success: false, message: "Server error while searching" });
  }
};
