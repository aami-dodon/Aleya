import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext();
const STORAGE_KEY = "aleya.auth";

function safeGetItem(key) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn("Unable to access localStorage", error);
    return null;
  }
}

function safeSetItem(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Unable to persist auth state", error);
  }
}

function safeRemoveItem(key) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.warn("Unable to clear auth state", error);
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const stored = safeGetItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState((prev) => ({ ...prev, ...parsed, loading: false }));
      } catch (error) {
        console.warn("Failed to parse stored auth state", error);
        safeRemoveItem(STORAGE_KEY);
        setState((prev) => ({ ...prev, loading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const persist = (token, user) => {
    const payload = { token, user };
    safeSetItem(STORAGE_KEY, JSON.stringify(payload));
    setState({ token, user, loading: false, error: null });
  };

  const clear = () => {
    safeRemoveItem(STORAGE_KEY);
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

  const deleteAccount = async (password) => {
    if (!state.token) throw new Error("Not authenticated");
    if (!password) throw new Error("Password is required");

    const response = await apiClient.del("/auth/me", state.token, {
      data: { password },
    });

    clear();
    return response;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
