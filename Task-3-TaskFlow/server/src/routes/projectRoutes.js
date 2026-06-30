import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  inviteMember,
  removeMember,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireProjectRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect); // every project route requires authentication

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);

router.put("/:id", requireProjectRole("owner", "admin"), updateProject);
router.delete("/:id", requireProjectRole("owner"), deleteProject);

router.post("/:id/invite", requireProjectRole("owner", "admin"), inviteMember);
router.delete("/:id/members/:memberId", requireProjectRole("owner", "admin"), removeMember);

export default router;
