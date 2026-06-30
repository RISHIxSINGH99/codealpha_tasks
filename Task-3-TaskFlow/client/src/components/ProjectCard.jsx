import { Link } from "react-router-dom";

/**
 * Project summary card shown on the Projects page grid.
 */
const ProjectCard = ({ project }) => {
  const memberCount = (project.members?.length || 0) + 1; // +1 for owner

  return (
    <div className="card p-5 hover:border-accent/50 transition-colors duration-150">
      <Link to={`/projects/${project._id}/board`} className="block">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display font-semibold text-gray-100 truncate">{project.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-gray-400 shrink-0 ml-2">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
          {project.description || "No description provided."}
        </p>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-accent-muted text-accent-hover flex items-center justify-center text-[11px] font-semibold">
            {project.owner?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="text-xs text-gray-500">Owned by {project.owner?.name || "Unknown"}</span>
        </div>
      </Link>
      {project.isArchived && (
        <span className="inline-flex mt-3 text-[11px] px-2 py-0.5 rounded-full bg-warning/15 text-warning">
          Archived
        </span>
      )}
    </div>
  );
};

export default ProjectCard;
