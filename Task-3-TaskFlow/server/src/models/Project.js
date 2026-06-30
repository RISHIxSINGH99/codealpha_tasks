import mongoose from "mongoose";

/**
 * A Project is a workspace that contains Tasks.
 * `members` stores per-project role so the same user can be an
 * "admin" on one project and a plain "member" on another.
 */
const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    // soft-delete flag instead of hard delete, keeps tasks/comments intact for audit
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Speeds up "list my projects" queries
projectSchema.index({ owner: 1 });
projectSchema.index({ "members.user": 1 });

const toUserIdString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (value && typeof value === "object" && value._id) return value._id.toString();
  return value.toString();
};

projectSchema.methods.isMember = function (userId) {
  const targetId = toUserIdString(userId);
  if (!targetId) return false;

  return (
    toUserIdString(this.owner) === targetId ||
    this.members.some((m) => toUserIdString(m.user) === targetId)
  );
};

projectSchema.methods.getMemberRole = function (userId) {
  const targetId = toUserIdString(userId);
  if (!targetId) return null;

  if (toUserIdString(this.owner) === targetId) return "owner";
  const member = this.members.find((m) => toUserIdString(m.user) === targetId);
  return member ? member.role : null;
};

const Project = mongoose.model("Project", projectSchema);
export default Project;
