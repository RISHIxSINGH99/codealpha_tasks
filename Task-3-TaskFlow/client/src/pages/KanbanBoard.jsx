import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios.js";
import AppLayout from "../components/AppLayout.jsx";
import TaskCard from "../components/TaskCard.jsx";
import Modal from "../components/Modal.jsx";
import FormInput from "../components/FormInput.jsx";
import Loader from "../components/Loader.jsx";

const columns = [
  { key: "todo", label: "Todo" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Done" },
];

/**
 * Kanban board for a single project. Tasks are grouped by status
 * client-side and moved between columns using native HTML5
 * drag-and-drop, with the new status persisted via PATCH.
 */
const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", status: "todo", assignedTo: "", dueDate: "" });

  const socketRef = useRef(null);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks/project/${projectId}`),
      ]);
      setProject(projectRes.data.data.project);
      setTasks(tasksRes.data.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
    const socket = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.emit("joinProject", projectId);

    socket.on("taskUpdated", (updatedTask) => {
      setTasks((prev) => {
        const exists = prev.some((t) => t._id === updatedTask._id);
        if (exists) {
          return prev.map((t) => (t._id === updatedTask._id ? updatedTask : t));
        } else {
          return [...prev, updatedTask];
        }
      });
    });

    return () => {
      socket.emit("leaveProject", projectId);
      socket.disconnect();
    };
  }, [projectId]);

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === status) return;

    setError("");

    // Optimistic UI update so the card moves instantly
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));

    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      if (socketRef.current) {
        socketRef.current.emit("taskMoved", { projectId, task: data.data.task });
      }
    } catch (err) {
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: task.status } : t)));
      setError(err.response?.data?.message || "Failed to move task");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form, project: projectId, assignedTo: form.assignedTo || undefined, dueDate: form.dueDate || undefined };
      const { data } = await api.post("/tasks", payload);
      setTasks((prev) => [...prev, data.data.task]);
      if (socketRef.current) {
        socketRef.current.emit("taskMoved", { projectId, task: data.data.task });
      }
      setModalOpen(false);
      setForm({ title: "", description: "", priority: "medium", status: "todo", assignedTo: "", dueDate: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const allMembers = project ? [project.owner, ...project.members.map((m) => m.user)] : [];

  if (loading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center"><Loader /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-100">{project?.name}</h1>
          <p className="text-sm text-gray-500">{project?.description}</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">+ New task</button>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`rounded-xl p-3 min-h-[60vh] transition-colors duration-150 ${
                dragOverColumn === col.key ? "bg-accent-muted/30 border border-accent/40" : "bg-surface-raised/40 border border-surface-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-gray-300">{col.label}</h3>
                <span className="text-xs text-gray-500 bg-surface-overlay rounded-full px-2 py-0.5">{colTasks.length}</span>
              </div>

              {colTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-surface-border px-3 py-4 text-center text-xs text-gray-500">
                  Drop tasks here
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onDragStart={handleDragStart}
                    onClick={() => navigate(`/tasks/${task._id}`)}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create a new task"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !form.title} className="btn-primary">
              {creating ? "Creating..." : "Create task"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <FormInput
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Design the landing page hero"
            required
          />
          <FormInput
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Details about the task"
          />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
              <select
                className="input-field"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Assignee</label>
              <select
                className="input-field"
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {allMembers.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <FormInput
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default KanbanBoard;
