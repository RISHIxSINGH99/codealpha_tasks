import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import AppLayout from "../components/AppLayout.jsx";
import Loader from "../components/Loader.jsx";

const statusOptions = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Completed" },
];

/**
 * Full detail view for a single task: editable fields, comment
 * thread, and a delete action.
 */
const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.data.task);
      setComments(data.data.comments);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleFieldSave = async (fields) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/tasks/${taskId}`, fields);
      setTask((prev) => ({ ...prev, ...data.data.task }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      setTask((prev) => ({ ...prev, status: data.data.task.status }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      navigate(`/projects/${task.project._id || task.project}/board`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const { data } = await api.post("/comments", { task: taskId, text: newComment.trim() });
      setComments((prev) => [...prev, data.data.comment]);
      setNewComment("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center"><Loader /></div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <p className="text-danger">{error || "Task not found"}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-300 mb-4">
        ← Back to board
      </button>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 card p-6">
          <input
            defaultValue={task.title}
            onBlur={(e) => e.target.value !== task.title && handleFieldSave({ title: e.target.value })}
            className="w-full bg-transparent text-xl font-display font-bold text-gray-100 outline-none mb-4 border-b border-transparent focus:border-surface-border pb-1"
          />
          <textarea
            defaultValue={task.description}
            onBlur={(e) => e.target.value !== task.description && handleFieldSave({ description: e.target.value })}
            placeholder="Add a description..."
            rows={5}
            className="w-full bg-surface-overlay rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-accent border border-surface-border resize-none"
          />

          {/* Comments */}
          <div className="mt-8">
            <h3 className="font-display font-semibold text-gray-100 mb-4">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h3>
            <div className="space-y-4 mb-4">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent-muted text-accent-hover flex items-center justify-center text-xs font-semibold shrink-0">
                    {c.author?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="bg-surface-overlay rounded-lg p-3 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-200">{c.author?.name}</span>
                      <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-300">{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="input-field flex-1"
              />
              <button type="submit" disabled={postingComment} className="btn-primary shrink-0">
                Post
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Status</label>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input-field"
            >
              {statusOptions.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Priority</label>
            <select
              defaultValue={task.priority}
              onChange={(e) => handleFieldSave({ priority: e.target.value })}
              className="input-field"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Due date</label>
            <input
              type="date"
              defaultValue={task.dueDate ? task.dueDate.split("T")[0] : ""}
              onChange={(e) => handleFieldSave({ dueDate: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Assignee</label>
            <p className="text-sm text-gray-300">{task.assignedTo?.name || "Unassigned"}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Created by</label>
            <p className="text-sm text-gray-300">{task.createdBy?.name}</p>
          </div>

          {saving && <p className="text-xs text-gray-500">Saving...</p>}

          <button onClick={handleDelete} className="text-sm text-danger hover:underline pt-2">
            Delete task
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default TaskDetails;
