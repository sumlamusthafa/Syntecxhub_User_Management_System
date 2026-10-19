import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/auth-context.js";
import Avatar from "../components/Avatar.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { roleLabel } from "../roles.js";

const PAGE_SIZE = 8;

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Users() {
  const { user: me } = useAuth();

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState({ key: "", data: null, error: "" });
  const [notice, setNotice] = useState(null); // { type, text }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Wait a moment after typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const key = `${query}|${page}|${reload}`;

  useEffect(() => {
    let active = true;
    api
      .listUsers({ page, limit: PAGE_SIZE, search: query })
      .then((data) => {
        if (active) setResult({ key, data, error: "" });
      })
      .catch((err) => {
        if (active) setResult({ key, data: null, error: err.message });
      });
    return () => {
      active = false;
    };
  }, [key, page, query]);

  const loading = result.key !== key;
  const data = result.data;
  const users = data?.users ?? [];

  async function changeRole(target, role) {
    setNotice(null);
    try {
      await api.updateUser(target.id, { role });
      setNotice({ type: "success", text: `${target.name} is now ${role === "admin" ? "staff" : "a student"}.` });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
    setReload((n) => n + 1);
  }

  async function confirmDelete() {
    const target = pendingDelete;
    setDeleting(true);
    try {
      await api.deleteUser(target.id);
      setNotice({ type: "success", text: `${target.name} was deleted.` });
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
    setDeleting(false);
    setPendingDelete(null);
    setReload((n) => n + 1);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Students</h1>
          <p className="muted">
            {data ? `${data.total} ${data.total === 1 ? "record" : "records"}` : "Loading…"}
            {query && data ? ` matching “${query}”` : ""}
          </p>
        </div>
        <div className="search">
          <label htmlFor="search" className="sr-only">
            Search students
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {notice && (
        <div
          className={`banner banner-${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.text}
        </div>
      )}

      {result.error && !loading ? (
        <div className="banner banner-error" role="alert">
          {result.error}{" "}
          <button type="button" className="link-button" onClick={() => setReload((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <div className={`table-wrap${loading ? " is-loading" : ""}`} aria-busy={loading}>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Access</th>
                <th scope="col" className="col-joined">
                  Joined
                </th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="person">
                        <Avatar name={u.name} tone={u.role === "admin" ? "amber" : "mint"} />
                        <div>
                          <strong>
                            {u.name}
                            {isMe && <span className="you">You</span>}
                          </strong>
                          <span className="muted">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isMe ? (
                        <span className={`role role-${u.role}`}>{roleLabel(u.role)}</span>
                      ) : (
                        <select
                          className="role-select"
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value)}
                          aria-label={`Access for ${u.name}`}
                        >
                          <option value="user">student</option>
                          <option value="admin">staff</option>
                        </select>
                      )}
                    </td>
                    <td className="col-joined muted">{formatDate(u.createdAt)}</td>
                    <td className="cell-actions">
                      {!isMe && (
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => setPendingDelete(u)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && users.length === 0 && (
            <p className="empty">
              {query ? `No one matches “${query}”. Try a different name or email.` : "No students yet."}
            </p>
          )}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="muted">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages || loading}
          >
            Next
          </button>
        </nav>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name ?? "this student"}?`}
        message="Their student record will be removed permanently. This can't be undone."
        confirmLabel="Delete student"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
