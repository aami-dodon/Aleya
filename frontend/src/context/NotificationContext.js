import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  refresh: () => {},
  markAsRead: async () => {},
  isEnabled: false,
});

export function NotificationProvider({ children }) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inAppPreference =
    user?.notificationPreferences?.channels?.inApp ?? true;
  const isEnabled = Boolean(token && user && inAppPreference !== false);

  const fetchNotifications = useCallback(async () => {
    if (!isEnabled) {
      setNotifications([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get("/notifications", token);
      setNotifications(response.notifications || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isEnabled, token]);

  useEffect(() => {
    if (!isEnabled) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchNotifications, isEnabled]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!isEnabled || !notificationId) {
        return;
      }

      try {
        await apiClient.post(
          `/notifications/${notificationId}/read`,
          null,
          token
        );

        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === notificationId
              ? { ...notification, readAt: new Date().toISOString() }
              : notification
          )
        );
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [isEnabled, token]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.readAt)
        .length,
      loading,
      error,
      refresh: fetchNotifications,
      markAsRead,
      isEnabled,
    }),
    [notifications, loading, error, fetchNotifications, markAsRead, isEnabled]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
