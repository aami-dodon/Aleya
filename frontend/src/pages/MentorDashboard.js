import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import MetricCard from "../components/MetricCard";
import MentorRequestList from "../components/MentorRequestList";
import MoodTrendChart from "../components/MoodTrendChart";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

function MentorDashboard() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [dashRes, requestRes, notificationRes] = await Promise.all([
        apiClient.get("/dashboard/mentor", token),
        apiClient.get("/mentors/requests", token),
        apiClient.get("/mentors/notifications", token),
      ]);
      setDashboard(dashRes);
      setRequests(requestRes.requests || []);
      setNotifications(notificationRes.notifications || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAccept = async (request) => {
    await apiClient.post(`/mentors/requests/${request.id}/accept`, null, token);
    loadAll();
  };

  const handleConfirm = async (request) => {
    await apiClient.post(`/mentors/requests/${request.id}/confirm`, null, token);
    loadAll();
  };

  const handleDecline = async (request) => {
    await apiClient.post(`/mentors/requests/${request.id}/decline`, null, token);
    loadAll();
  };

  const markNotification = async (notification) => {
    await apiClient.post(
      `/mentors/notifications/${notification.id}/read`,
      null,
      token
    );
    loadAll();
  };

  if (loading && !dashboard) {
    return <LoadingState label="Loading mentor dashboard" />;
  }

  return (
    <div className="dashboard-page">
      <SectionCard
        title="Mentor overview"
        subtitle="Encourage consistency and spot tender seasons quickly"
      >
        {error && <p className="form-error">{error}</p>}
        {dashboard ? (
          <div className="metrics-grid">
            <MetricCard
              title="Active mentees"
              value={dashboard.overview?.menteeCount || 0}
              description="Number of journalers currently linked with you."
            />
            <MetricCard
              title="Pending requests"
              value={dashboard.overview?.pendingRequests || 0}
              description="People waiting for your response."
            />
            <MetricCard
              title="Unread updates"
              value={dashboard.overview?.unreadNotifications || 0}
              description="Entries shared with you that need a review."
            />
          </div>
        ) : (
          <p className="empty-state">Link with a journaler to begin mentoring.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Incoming mentorship requests"
        subtitle="Review invitations and accept when it’s a good fit"
      >
        <MentorRequestList
          requests={requests}
          role="mentor"
          onAccept={handleAccept}
          onConfirm={handleConfirm}
          onDecline={handleDecline}
        />
      </SectionCard>

      <SectionCard
        title="Mentees"
        subtitle="Recent reflections shared with you"
      >
        {dashboard?.mentees?.length ? (
          <div className="mentee-grid">
            {dashboard.mentees.map((mentee) => (
              <article key={mentee.id} className="mentee-card">
                <header>
                  <h3>{mentee.name}</h3>
                  <span className="chip">
                    Avg mood: {mentee.averageMood ? mentee.averageMood.toFixed(2) : "—"}
                  </span>
                </header>
                {mentee.trend?.length ? (
                  <MoodTrendChart data={mentee.trend} />
                ) : (
                  <p className="empty-state">No shared entries yet.</p>
                )}
                {mentee.alerts?.lowMood?.length > 0 && (
                  <div className="alert">
                    <strong>Low mood flags</strong>
                    <ul>
                      {mentee.alerts.lowMood.map((alert) => (
                        <li key={alert.id}>
                          {format(parseISO(alert.entryDate), "MMM d")} – {alert.mood}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {mentee.alerts?.crisis?.length > 0 && (
                  <div className="alert alert-critical">
                    <strong>Attention needed</strong>
                    <ul>
                      {mentee.alerts.crisis.map((alert) => (
                        <li key={alert.id}>{alert.summary}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {mentee.recentEntries?.length > 0 && (
                  <ul className="entry-responses">
                    {mentee.recentEntries.slice(0, 2).map((entry) => (
                      <li key={entry.id}>
                        <span>{format(parseISO(entry.entryDate), "MMM d")}:</span> {entry.summary || entry.mood}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No mentees yet. Accept a request to begin.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Notifications"
        subtitle="Entries shared with you based on mentee privacy settings"
      >
        {notifications.length ? (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li key={notification.id} className="notification-item">
                <div>
                  <h4>{notification.journaler.name}</h4>
                  <p>
                    {format(parseISO(notification.entry.entryDate), "MMM d, yyyy")} ·
                    Mood: {notification.entry.mood || "—"}
                  </p>
                  {notification.entry.summary && (
                    <p className="notification-summary">
                      {notification.entry.summary}
                    </p>
                  )}
                </div>
                {!notification.readAt && (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => markNotification(notification)}
                  >
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">You're all caught up.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default MentorDashboard;
