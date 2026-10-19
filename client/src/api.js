const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);
const TOKEN_KEY = "roster_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable, the session lasts until the page closes */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Check your connection and try again.",
      0
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* response had no JSON body */
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  me: () => request("/api/users/me"),
  listUsers: ({ page = 1, limit = 8, search = "" } = {}) =>
    request(`/api/users?${new URLSearchParams({ page, limit, search })}`),
  updateUser: (id, body) => request(`/api/users/${id}`, { method: "PUT", body }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
};
