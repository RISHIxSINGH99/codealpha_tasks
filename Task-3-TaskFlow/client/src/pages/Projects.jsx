import { useEffect, useState } from "react";
import api from "../api/axios.js";
import AppLayout from "../components/AppLayout.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import Modal from "../components/Modal.jsx";
import FormInput from "../components/FormInput.jsx";
import Loader from "../components/Loader.jsx";

/**
 * Grid of all projects the user owns or is a member of, with a
 * modal to create new ones.
 */
const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [memberInputs, setMemberInputs] = useState({});
  const [memberLoading, setMemberLoading] = useState(false);
  const [savingProject, setSavingProject] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data.data.projects);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/projects", form);
      setModalOpen(false);
      setForm({ name: "", description: "" });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const openProjectEditor = (project) => {
    setActiveProject(project);
    setForm({ name: project.name, description: project.description || "" });
    setModalOpen(true);
  };

  const handleProjectSave = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    setSavingProject(true);
    try {
      await api.put(`/projects/${activeProject._id}`, { name: form.name, description: form.description });
      setModalOpen(false);
      setActiveProject(null);
      setForm({ name: "", description: "" });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    } finally {
      setSavingProject(false);
    }
  };

  const handleArchiveToggle = async (project) => {
    try {
      await api.put(`/projects/${project._id}`, { isArchived: !project.isArchived });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    }
  };

  const handleInviteMember = async (e, project) => {
    e.preventDefault();
    const input = memberInputs[project._id] || { email: "", role: "member" };
    if (!input.email?.trim()) return;
    setMemberLoading(true);
    try {
      await api.post(`/projects/${project._id}/invite`, { email: input.email.trim(), role: input.role });
      setMemberInputs((prev) => ({ ...prev, [project._id]: { email: "", role: "member" } }));
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to invite member");
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (project, memberId) => {
    try {
      await api.delete(`/projects/${project._id}/members/${memberId}`);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/projects/${project._id}`);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500">Everything you own or collaborate on.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          + New project
        </button>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Loader /></div>
      ) : projects.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-400 mb-2">You don't have any projects yet.</p>
          <p className="text-sm text-gray-500">Create one to start organizing tasks with your team.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="space-y-3">
              <ProjectCard project={project} />
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-200">Collaborators</p>
                    <p className="text-xs text-gray-500">Manage members and access</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openProjectEditor(project)} className="text-sm text-accent-hover">Edit</button>
                    <button onClick={() => handleArchiveToggle(project)} className="text-sm text-warning">
                      {project.isArchived ? "Restore" : "Archive"}
                    </button>
                    <button onClick={() => handleDeleteProject(project)} className="text-sm text-danger">Delete</button>
                  </div>
                </div>
                <form onSubmit={(e) => handleInviteMember(e, project)} className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={memberInputs[project._id]?.email || ""}
                    onChange={(e) => setMemberInputs((prev) => ({ ...prev, [project._id]: { ...(prev[project._id] || { role: "member" }), email: e.target.value } }))}
                    placeholder="Invite by email"
                    className="input-field flex-1"
                  />
                  <select
                    value={memberInputs[project._id]?.role || "member"}
                    onChange={(e) => setMemberInputs((prev) => ({ ...prev, [project._id]: { ...(prev[project._id] || { email: "" }), role: e.target.value } }))}
                    className="input-field sm:w-32"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" disabled={memberLoading || !(memberInputs[project._id]?.email || "").trim()} className="btn-primary sm:w-auto">
                    {memberLoading ? "Inviting..." : "Invite"}
                  </button>
                </form>
                <div className="space-y-2">
                  {project.owner && (
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>{project.owner.name} (Owner)</span>
                    </div>
                  )}
                  {project.members?.map((member) => (
                    <div key={member.user?._id} className="flex items-center justify-between text-sm text-gray-300">
                      <span>{member.user?.name || "Unknown"} ({member.role})</span>
                      <button onClick={() => handleRemoveMember(project, member.user?._id)} className="text-xs text-danger">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveProject(null);
          setForm({ name: "", description: "" });
        }}
        title={activeProject ? "Edit project" : "Create a new project"}
        footer={
          <>
            <button onClick={() => {
              setModalOpen(false);
              setActiveProject(null);
              setForm({ name: "", description: "" });
            }} className="btn-secondary">Cancel</button>
            <button onClick={activeProject ? handleProjectSave : handleCreate} disabled={creating || savingProject || !form.name} className="btn-primary">
              {activeProject ? (savingProject ? "Saving..." : "Save project") : (creating ? "Creating..." : "Create project")}
            </button>
          </>
        }
      >
        <form onSubmit={activeProject ? handleProjectSave : handleCreate}>
          <FormInput
            label="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Website Redesign"
            required
          />
          <FormInput
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this project about?"
          />
        </form>
      </Modal>
    </AppLayout>
  );
};

export default Projects;
