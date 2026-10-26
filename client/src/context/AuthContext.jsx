import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("puctrack_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("puctrack_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Re-validate the stored token on page load; drop it if it's stale.
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me", token)
      .then(({ user }) => setUser(user))
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("puctrack_token");
        localStorage.removeItem("puctrack_user");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("puctrack_token", nextToken);
    localStorage.setItem("puctrack_user", JSON.stringify(nextUser));
  }

  async function login(email, password) {
    const { token, user } = await api.post("/auth/login", { email, password });
    persist(token, user);
    return user;
  }

  async function register(name, email, password) {
    const { token, user } = await api.post("/auth/register", { name, email, password });
    persist(token, user);
    return user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("puctrack_token");
    localStorage.removeItem("puctrack_user");
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
