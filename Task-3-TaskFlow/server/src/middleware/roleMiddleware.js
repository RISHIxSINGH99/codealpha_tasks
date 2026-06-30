import Project from "../models/Project.js";

/**
 * Role-based authorization for project-scoped actions.
 * Loads the project from `req.params.id` (or `req.params.projectId`),
 * checks the requesting user's role within that project, and attaches
 * the project document + role to the request so controllers don't
 * have to re-fetch it.
 *
 * Usage: router.delete("/:id", protect, requireProjectRole("owner"), deleteProject)
 */
export const requireProjectRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.id || req.params.projectId;
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }

      const role = project.getMemberRole(req.user._id);

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Access denied: you are not a member of this project",
        });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: requires role [${allowedRoles.join(", ")}]`,
        });
      }

      req.project = project;
      req.projectRole = role;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error during authorization check" });
    }
  };
};

/**
 * Global, app-level role check (e.g. admin-only routes).
 * Independent from project-level roles above.
 */
export const requireGlobalRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient privileges",
      });
    }
    next();
  };
};
