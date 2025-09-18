import { format, parseISO } from "date-fns";
import LoadingState from "./LoadingState";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  emptyStateClasses,
  infoTextClasses,
  secondaryButtonClasses,
} from "../styles/ui";

function formatEntryDate(value) {
  if (!value) return null;
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch (error) {
    return value;
  }
}

function formatCreatedAt(value) {
  if (!value) return null;
  try {
    return format(parseISO(value), "MMM d, yyyy p");
  } catch (error) {
    return value;
  }
}

function NotificationList({
  notifications,
  onMarkRead,
  loading = false,
  emptyLabel = "You're all caught up.",
  limit,
}) {
  if (loading) {
    return <LoadingState label="Loading notifications" compact />;
  }

  const visibleNotifications = Array.isArray(notifications)
    ? notifications.slice(0, limit || notifications.length)
    : [];

  if (!visibleNotifications.length) {
    return <p className={emptyStateClasses}>{emptyLabel}</p>;
  }

  return (
    <ul className="grid gap-4">
      {visibleNotifications.map((notification) => {
        const createdAt = formatCreatedAt(notification.createdAt);

        if (notification.type === "panic_alert") {
          const senderName =
            notification.payload?.senderName || notification.payload?.senderEmail;
          const message = notification.payload?.message;

          return (
            <li
              key={notification.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-5"
            >
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-rose-700">
                    Panic alert from {senderName || "a mentor"}
                  </p>
                  <p className={`${bodySmallStrongTextClasses} text-rose-600`}>
                    Immediate support requested
                  </p>
                  {message && (
                    <p className={`${bodySmallMutedTextClasses} whitespace-pre-line text-emerald-900/80`}>
                      {message}
                    </p>
                  )}
                </div>
                {createdAt && (
                  <p className={`${bodySmallMutedTextClasses} text-emerald-900/60`}>
                    Sent {createdAt}
                  </p>
                )}
              </div>
              {!notification.readAt && (
                <button
                  type="button"
                  className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
                  onClick={() => onMarkRead?.(notification.id)}
                >
                  Mark as read
                </button>
              )}
            </li>
          );
        }

        const entryDate = formatEntryDate(notification.entry?.entryDate);
        const mood = notification.entry?.mood;
        const summary = notification.entry?.summary;

        return (
          <li
            key={notification.id}
            className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/70 p-5"
          >
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-base font-semibold text-emerald-900">
                  {notification.journaler?.name || "Mentee update"}
                </p>
                <p className={infoTextClasses}>
                  {entryDate ? `${entryDate} · ` : ""}
                  Mood: {mood || "—"}
                </p>
                {summary && (
                  <p className={`${bodySmallMutedTextClasses} text-emerald-900/80`}>
                    {summary}
                  </p>
                )}
              </div>
              {createdAt && (
                <p className={`${bodySmallMutedTextClasses} text-emerald-900/60`}>
                  Shared {createdAt}
                </p>
              )}
            </div>
            {!notification.readAt && (
              <button
                type="button"
                className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
                onClick={() => onMarkRead?.(notification.id)}
              >
                Mark as read
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default NotificationList;
