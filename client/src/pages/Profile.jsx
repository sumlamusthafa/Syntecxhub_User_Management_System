import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/auth-context.js";
import Avatar from "../components/Avatar.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { roleLabel } from "../roles.js";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setMessage(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    const changes = {};
    if (form.name.trim() !== user.name) changes.name = form.name.trim();
    if (form.email.trim().toLowerCase() !== user.email) {
      changes.email = form.email.trim();
    }
    if (form.password) changes.password = form.password;

    if (Object.keys(changes).length === 0) {
      setMessage({ type: "info", text: "There's nothing to save yet." });
      return;
    }
    if (changes.password && changes.password.length < 6) {
      setMessage({ type: "error", text: "Use at least 6 characters for the new password." });
      return;
    }

    setSaving(true);
    try {
      const data = await api.updateUser(user.id, changes);
      setUser(data.user);
      setForm({ name: data.user.name, email: data.user.email, password: "" });
      setMessage({ type: "success", text: "Changes saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteUser(user.id);
      logout();
    } catch (err) {
      setDeleting(false);
      setConfirmOpen(false);
      setMessage({ type: "error", text: err.message });
    }
  }

  return (
    <>
      <section className="identity">
        <Avatar name={user.name} size="lg" tone={user.role === "admin" ? "amber" : "mint"} />
        <div className="identity-text">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="identity-meta">
          <span className={`role role-${user.role}`}>{roleLabel(user.role)}</span>
          {user.createdAt && <span className="muted">Joined {formatDate(user.createdAt)}</span>}
        </div>
      </section>

      {user.role === "admin" && (
        <p className="admin-hint">
          You're staff. <Link to="/users">Manage students</Link>
        </p>
      )}

      <section className="panel">
        <h2>Student details</h2>
        <form onSubmit={handleSave} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="p-name">Full name</label>
              <input id="p-name" name="name" value={form.name} onChange={handleChange} autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="p-email">Email</label>
              <input id="p-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />
            </div>
            <div className="field field-wide">
              <label htmlFor="p-password">New password</label>
              <input
                id="p-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Leave blank to keep your current password"
              />
            </div>
          </div>

          {message && (
            <div
              className={`banner banner-${message.type}`}
              role={message.type === "error" ? "alert" : "status"}
            >
              {message.text}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel panel-danger">
        <div>
          <h2>Delete account</h2>
          <p className="muted">
            This removes your account and signs you out. It can't be undone.
          </p>
        </div>
        <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmOpen(true)}>
          Delete my account
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        message="Your account will be removed permanently and you will be signed out."
        confirmLabel="Delete account"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
