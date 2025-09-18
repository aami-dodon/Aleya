import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import MetricCard from "../components/MetricCard";
import MentorRequestList from "../components/MentorRequestList";
import MoodTrendChart from "../components/MoodTrendChart";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  emptyStateClasses,
  getShareChipClasses,
} from "../styles/ui";

function MentorDashboard() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [dashRes, requestRes] = await Promise.all([
        apiClient.get("/dashboard/mentor", token),
        apiClient.get("/mentors/requests", token),
      ]);
      setDashboard(dashRes);
      setRequests(requestRes.requests || []);
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

  if (loading && !dashboard) {
    return <LoadingState label="Illuminating your mentor canopy" />;
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      <SectionCard
        title="Mentor constellation"
        subtitle="Encourage steady practice and notice tender seasons quickly"
      >
        {error && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </p>
        )}
        {dashboard ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Active mentees"
              value={dashboard.overview?.menteeCount || 0}
              description="Journalers currently linked beneath your guidance."
            />
            <MetricCard
              title="Pending invitations"
              value={dashboard.overview?.pendingRequests || 0}
              description="People waiting for your welcome."
            />
          </div>
        ) : (
          <p className={emptyStateClasses}>
            Link with a journaler to begin weaving this constellation.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Incoming mentorship invitations"
        subtitle="Review each invitation and respond when the timing feels right"
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
        subtitle="Recent reflections your mentees have shared"
      >
        {dashboard?.mentees?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {dashboard.mentees.map((mentee) => (
              <article
                key={mentee.id}
                className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white/70 p-5 shadow-inner shadow-emerald-900/5"
              >
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-emerald-900">{mentee.name}</h3>
                  <span className={getShareChipClasses("summary")}>
                    Avg mood: {mentee.averageMood ? mentee.averageMood.toFixed(2) : "—"}
                  </span>
                </header>
                {mentee.trend?.length ? (
                  <MoodTrendChart data={mentee.trend} />
                ) : (
                  <p className={emptyStateClasses}>No shared entries yet—invite them to share when ready.</p>
                )}
                {mentee.alerts?.lowMood?.length > 0 && (
                  <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/80 p-4">
                    <strong className="block text-sm text-amber-700">
                      Low mood flags
                    </strong>
                    <ul className="mt-2 space-y-1 text-sm text-amber-800">
                      {mentee.alerts.lowMood.map((alert) => (
                        <li key={alert.id}>
                          {format(parseISO(alert.entryDate), "MMM d")} – {alert.mood}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {mentee.alerts?.crisis?.length > 0 && (
                  <div className="rounded-2xl border-l-4 border-rose-500 bg-rose-50/80 p-4">
                    <strong className="block text-sm text-rose-600">
                      Attention needed
                    </strong>
                    <ul className="mt-2 space-y-1 text-sm text-rose-700">
                      {mentee.alerts.crisis.map((alert) => (
                        <li key={alert.id}>{alert.summary}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {mentee.recentEntries?.length > 0 && (
                  <ul className="grid gap-1 text-sm text-emerald-900/70">
                    {mentee.recentEntries.slice(0, 2).map((entry) => (
                      <li key={entry.id}>
                        <span className="font-semibold text-emerald-900">
                          {format(parseISO(entry.entryDate), "MMM d")}:
                        </span>{" "}
                        {entry.summary || entry.mood}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className={emptyStateClasses}>No mentees yet. Accept a request to begin weaving together.</p>
        )}
      </SectionCard>

    </div>
  );
}

export default MentorDashboard;
