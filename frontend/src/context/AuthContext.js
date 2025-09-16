import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext();
const STORAGE_KEY = "aleya.auth";

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState((prev) => ({ ...prev, ...parsed, loading: false }));
      } catch (error) {
        console.warn("Failed to parse stored auth state", error);
        localStorage.removeItem(STORAGE_KEY);
        setState((prev) => ({ ...prev, loading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const persist = (token, user) => {
    const payload = { token, user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setState({ token, user, loading: false, error: null });
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, token: null, loading: false, error: null });
  };

  const login = async (credentials) => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const data = await apiClient.post("/auth/login", credentials);
      persist(data.token, data.user);
      return data.user;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const register = async (payload) => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const data = await apiClient.post("/auth/register", payload);
      return data;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const logout = () => clear();

  const refreshProfile = async () => {
    if (!state.token) return null;
    try {
      const data = await apiClient.get("/auth/me", state.token);
      persist(state.token, data.user);
      return data.user;
    } catch (error) {
      console.error("Failed to refresh profile", error);
      return null;
    }
  };

  const updateProfile = async (updates) => {
    if (!state.token) throw new Error("Not authenticated");
    const data = await apiClient.patch("/auth/me", updates, state.token);
    persist(state.token, data.user);
    return data.user;
  };

  const requestMagicLink = async (email) => {
    if (!email) throw new Error("Email is required for magic link");
    await apiClient.post("/auth/magic-link", { email });
    return true;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
    requestMagicLink,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
