import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import AppLayout from "../components/AppLayout.jsx";
import FormInput from "../components/FormInput.jsx";

/**
 * Logged-in user's own profile - view + update name/avatar.
 * Email is intentionally read-only (changing it would require
 * re-verification, out of scope for this module).
 */
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", avatar: user?.avatar || "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const { data } = await api.put("/auth/profile", form);
      updateUser(data.data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-display font-bold text-gray-100 mb-1">Profile</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your account information.</p>

      <div className="card p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-accent-muted text-accent-hover flex items-center justify-center text-2xl font-semibold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-100">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {message && <p className="text-sm text-success mb-4">{message}</p>}
        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <FormInput
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <FormInput
            label="Avatar URL (optional)"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            placeholder="https://..."
          />
          <FormInput label="Email" value={user?.email || ""} disabled />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

export default Profile;
