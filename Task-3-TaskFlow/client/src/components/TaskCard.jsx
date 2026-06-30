const priorityStyles = {
  low: "bg-info/15 text-info",
  medium: "bg-warning/15 text-warning",
  high: "bg-danger/15 text-danger",
  urgent: "bg-danger/25 text-danger font-semibold",
};

/**
 * Single Kanban card. Draggable via native HTML5 drag-and-drop
 * (see KanbanBoard.jsx for the drop-zone logic).
 */
const TaskCard = ({ task, onDragStart, onClick }) => {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className="card p-3.5 mb-3 cursor-pointer hover:border-accent/50 transition-colors duration-150 active:opacity-70"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wide ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? "text-danger" : "text-gray-500"}`}>
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <h4 className="text-sm font-medium text-gray-100 mb-2 line-clamp-2">{task.title}</h4>

      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {task.labels.map((label) => (
            <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-overlay text-gray-400">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{task.assignedTo ? task.assignedTo.name : "Unassigned"}</span>
        {task.assignedTo && (
          <div className="h-6 w-6 rounded-full bg-accent-muted text-accent-hover flex items-center justify-center text-[11px] font-semibold">
            {task.assignedTo.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
