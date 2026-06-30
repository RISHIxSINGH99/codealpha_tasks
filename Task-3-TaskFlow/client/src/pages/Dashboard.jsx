import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import AppLayout from "../components/AppLayout.jsx";
import Loader from "../components/Loader.jsx";

const statusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  completed: "Completed",
};

const statusColors = {
  todo: "bg-gray-500",
  "in-progress": "bg-info",
  review: "bg-warning",
  completed: "bg-success",
};

/**
 * Landing page after login: high-level stats, tasks assigned to me,
 * and anything overdue across all of my projects.
 * Also handles search queries (q) by requesting matching results.
 */
const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [stats, setStats] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (searchQuery) {
          const { data } = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(data.data);
          setStats(null);
        } else {
          const { data } = await api.get("/dashboard");
          setStats(data.data);
          setSearchResults(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery]);

  if (loading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center"><Loader /></div>
      </AppLayout>
    );
  }

  if (searchQuery) {
    return (
      <AppLayout>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-100 mb-1">Search Results</h1>
            <p className="text-sm text-gray-500">Showing results for "{searchQuery}"</p>
          </div>
          <Link to="/dashboard" className="btn-secondary">Clear search</Link>
        </div>

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        {searchResults && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Projects */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-gray-100 mb-4">Projects ({searchResults.projects.length})</h2>
              {searchResults.projects.length === 0 ? (
                <p className="text-sm text-gray-500">No matching projects found.</p>
              ) : (
                <ul className="space-y-3">
                  {searchResults.projects.map((project) => (
                    <li key={project._id} className="border-b border-surface-border pb-3 last:border-0 last:pb-0">
                      <Link to={`/projects/${project._id}/board`} className="block hover:text-accent group">
                        <p className="font-medium text-gray-200 group-hover:text-accent transition-colors">{project.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{project.description || "No description provided."}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Tasks */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-gray-100 mb-4">Tasks ({searchResults.tasks.length})</h2>
              {searchResults.tasks.length === 0 ? (
                <p className="text-sm text-gray-500">No matching tasks found.</p>
              ) : (
                <ul className="space-y-3">
                  {searchResults.tasks.map((task) => (
                    <li key={task._id} className="border-b border-surface-border pb-3 last:border-0 last:pb-0">
                      <Link to={`/tasks/${task._id}`} className="block hover:text-accent group">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-gray-200 group-hover:text-accent transition-colors">{task.title}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-overlay text-gray-400 shrink-0">
                            {task.project?.name || "Unknown project"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{task.description || "No description provided."}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-display font-bold text-gray-100 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">A snapshot of everything happening across your projects.</p>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="card p-4">
              <p className="text-xs text-gray-500 mb-1">Projects</p>
              <p className="text-2xl font-display font-bold text-gray-100">{stats.totalProjects}</p>
            </div>
            {Object.entries(stats.tasksByStatus).map(([status, count]) => (
              <div key={status} className="card p-4">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusColors[status]}`} />
                  {statusLabels[status]}
                </p>
                <p className="text-2xl font-display font-bold text-gray-100">{count}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* My tasks */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-gray-100 mb-4">My tasks</h2>
              {stats.myTasks.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing assigned to you yet.</p>
              ) : (
                <ul className="space-y-3">
                  {stats.myTasks.map((task) => (
                    <li key={task._id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-200">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.project?.name}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColors[task.status]} text-white`}>
                        {statusLabels[task.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Overdue */}
            <div className="card p-5">
              <h2 className="font-display font-semibold text-gray-100 mb-4">Overdue tasks</h2>
              {stats.overdueTasks.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing overdue. Good work!</p>
              ) : (
                <ul className="space-y-3">
                  {stats.overdueTasks.map((task) => (
                    <li key={task._id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-200">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.project?.name}</p>
                      </div>
                      <span className="text-xs text-danger">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link to="/projects" className="btn-primary inline-block">
              Go to projects
            </Link>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Dashboard;
