import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";
import {
  getExpectedBootId,
  onBootIdMismatch,
  setExpectedBootId,
} from "../utils/sessionVersion";

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
    let isMounted = true;
    const storedValue = localStorage.getItem(STORAGE_KEY);
    let storedAuth = null;

    if (storedValue) {
      try {
        storedAuth = JSON.parse(storedValue);
      } catch (error) {
        console.warn("Failed to parse stored auth state", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (storedAuth?.bootId) {
      setExpectedBootId(storedAuth.bootId);
    }

    const clearAuth = () => {
      localStorage.removeItem(STORAGE_KEY);
      if (!isMounted) return;
      setState({ user: null, token: null, loading: false, error: null });
    };

    const unsubscribe = onBootIdMismatch(() => {
      clearAuth();
    });

    async function initialise() {
      let bootId = null;
      try {
        const data = await apiClient.get("/auth/session");
        bootId = data.bootId || null;
      } catch (error) {
        console.error("Failed to fetch session info", error);
      }

      if (!isMounted) {
        return;
      }

      if (bootId) {
        if (storedAuth?.bootId && storedAuth.bootId !== bootId) {
          clearAuth();
          setExpectedBootId(bootId);
          return;
        }

        if (storedAuth?.token && !storedAuth.bootId) {
          clearAuth();
          setExpectedBootId(bootId);
          return;
        }

        setExpectedBootId(storedAuth?.bootId || bootId);
      }

      if (storedAuth?.token && storedAuth?.user) {
        setState({
          token: storedAuth.token,
          user: storedAuth.user,
          loading: false,
          error: null,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    initialise();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const persist = (token, user) => {
    const payload = { token, user, bootId: getExpectedBootId() };
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
