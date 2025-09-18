import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationList from "./NotificationList";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import {
  bodySmallMutedTextClasses,
  iconButtonClasses,
} from "../styles/ui";

function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    isEnabled,
  } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    refresh();

    const handleClick = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, refresh]);

  if (!isEnabled) {
    return null;
  }

  const toggleOpen = () => {
    setIsOpen((previous) => !previous);
  };

  const handleMarkRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const helperText = (() => {
    if (user?.role === "mentor") {
      return "New entries appear here when mentees share reflections with you. Adjust what you receive in Settings.";
    }

    if (user?.role === "journaler") {
      return "Updates from your mentors and the Aleya team will appear here. Manage your preferences in Settings.";
    }

    if (user?.role === "admin") {
      return "Platform alerts and recent changes will be listed here. Fine-tune categories in Settings.";
    }

    return "Notifications will appear here when there are updates for your account. You can control channels in Settings.";
  })();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`${iconButtonClasses} relative`}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="sr-only">
          {isOpen ? "Close notifications" : "Open notifications"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-[6px] text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 z-40 mt-3 w-80 max-w-sm rounded-2xl border border-emerald-100 bg-white/95 p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-900">
              Notifications
            </p>
            <button
              type="button"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              onClick={() => {
                setIsOpen(false);
                navigate("/dashboard");
              }}
            >
              View dashboard
            </button>
          </div>
          <NotificationList
            notifications={notifications}
            onMarkRead={handleMarkRead}
            loading={loading}
            limit={5}
          />
          <p className={`${bodySmallMutedTextClasses} mt-3 text-emerald-900/70`}>
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
