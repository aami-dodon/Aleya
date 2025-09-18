import { format, parseISO } from "date-fns";
import LoadingState from "./LoadingState";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  chipBaseClasses,
  emptyStateClasses,
  infoTextClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "../styles/ui";

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
  emptyLabel = "The lantern is quiet for now.",
  limit,
}) {
  if (loading) {
    return <LoadingState label="Gathering shared lanterns" compact />;
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
        const categoryLabel = notification.category
          ? notification.category.charAt(0).toUpperCase() +
            notification.category.slice(1)
          : null;
        const isAlert = notification.category === "alerts";

        const wrapperClasses = isAlert
          ? "flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-5"
          : "flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-white/70 p-5";
        const titleClasses = isAlert
          ? "text-base font-semibold text-rose-700"
          : "text-base font-semibold text-emerald-900";

        const detailParts = [];
        if (notification.metadata?.mood) {
          detailParts.push(`Mood: ${notification.metadata.mood}`);
        }
        if (notification.metadata?.sharedLevel) {
          detailParts.push(
            `Shared as ${notification.metadata.sharedLevel.replace(/_/g, " ")}`
          );
        }
        if (notification.metadata?.completedCount) {
          detailParts.push(
            `${notification.metadata.completedCount} forms completed`
          );
        }
        if (notification.metadata?.senderEmail && isAlert) {
          detailParts.push(`From ${notification.metadata.senderEmail}`);
        }

        return (
          <li key={notification.id} className={wrapperClasses}>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className={titleClasses}>{notification.title}</p>
                {notification.body && (
                  <p
                    className={`${bodySmallMutedTextClasses} whitespace-pre-line text-emerald-900/80`}
                  >
                    {notification.body}
                  </p>
                )}
                {detailParts.length > 0 && (
                  <p className={`${infoTextClasses} text-emerald-900/70`}>
                    {detailParts.join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {categoryLabel && (
                  <span
                    className={`${chipBaseClasses} text-xs uppercase tracking-wide text-emerald-700`}
                  >
                    {categoryLabel}
                  </span>
                )}
                {createdAt && (
                  <p className={`${bodySmallMutedTextClasses} text-emerald-900/60`}>
                    Lantern lit {createdAt}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {notification.action && (
                <a
                  href={notification.action.url}
                  className={`${primaryButtonClasses} px-4 py-2 text-sm`}
                >
                  {notification.action.label}
                </a>
              )}
              {!notification.readAt && (
                <button
                  type="button"
                  className={`${secondaryButtonClasses} px-4 py-2 text-sm`}
                  onClick={() => onMarkRead?.(notification.id)}
                >
                  Mark as read
                </button>
              )}
              {notification.readAt && (
                <p className={`${bodySmallStrongTextClasses} text-xs text-emerald-900/60`}>
                  Read
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default NotificationList;
