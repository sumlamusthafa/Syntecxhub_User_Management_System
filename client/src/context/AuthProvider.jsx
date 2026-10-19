import { useCallback, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken } from "../api.js";
import { AuthContext } from "./auth-context.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // On first load, restore the session if a token is saved
  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    api
      .me()
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((err) => {
        if (err.status === 401) clearToken();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const finishAuth = useCallback(async (data) => {
    setToken(data.token);
    const me = await api.me();
    setUser(me.user);
  }, []);

  const login = useCallback(
    async (email, password) => finishAuth(await api.login({ email, password })),
    [finishAuth]
  );

  const register = useCallback(
    async (name, email, password) =>
      finishAuth(await api.register({ name, email, password })),
    [finishAuth]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
