import { format, isAfter, isEqual, parseISO, subMonths, subWeeks } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import JournalEntryForm from "../components/JournalEntryForm";
import LoadingState from "../components/LoadingState";
import MetricCard from "../components/MetricCard";
import MoodTrendChart from "../components/MoodTrendChart";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

const TIMEFRAME_OPTIONS = [
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "quarter", label: "Quarterly" },
];

function JournalerDashboard() {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [forms, setForms] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusVariant, setStatusVariant] = useState("info");
  const [timeframe, setTimeframe] = useState("week");
  const [formResetKey, setFormResetKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [formsRes, dashRes, entriesRes] = await Promise.all([
          apiClient.get("/forms", token),
          apiClient.get("/dashboard/journaler", token),
          apiClient.get("/journal-entries?limit=20", token),
        ]);

        if (!isMounted) return;

        setForms(formsRes.forms || []);
        setDashboard(dashRes);
        setEntries(entriesRes.entries || []);
        setError(null);

        if (!selectedFormId && formsRes.forms?.length) {
          setSelectedFormId(formsRes.forms[0].id);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [token, selectedFormId]);

  useEffect(() => {
    if (statusVariant !== "success" || !statusMessage) {
      return;
    }

    const timeout = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [statusVariant, statusMessage]);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === Number(selectedFormId)),
    [forms, selectedFormId]
  );

  const timeframeCutoff = useMemo(() => {
    const now = new Date();
    switch (timeframe) {
      case "week":
        return subWeeks(now, 1);
      case "month":
        return subMonths(now, 1);
      case "quarter":
        return subMonths(now, 3);
      default:
        return null;
    }
  }, [timeframe]);

  const filteredTrend = useMemo(() => {
    if (!dashboard?.trend?.length) {
      return [];
    }

    if (!timeframeCutoff) {
      return dashboard.trend;
    }

    return dashboard.trend.filter((point) => {
      if (!point.date) {
        return false;
      }

      const pointDate = parseISO(point.date);
      if (Number.isNaN(pointDate.getTime())) {
        return false;
      }

      return isAfter(pointDate, timeframeCutoff) || isEqual(pointDate, timeframeCutoff);
    });
  }, [dashboard?.trend, timeframeCutoff]);

  const filteredEntries = useMemo(() => {
    if (!entries.length) {
      return [];
    }

    if (!timeframeCutoff) {
      return entries;
    }

    return entries.filter((entry) => {
      if (!entry.entryDate) {
        return false;
      }

      const entryDate = parseISO(entry.entryDate);
      if (Number.isNaN(entryDate.getTime())) {
        return false;
      }

      return isAfter(entryDate, timeframeCutoff) || isEqual(entryDate, timeframeCutoff);
    });
  }, [entries, timeframeCutoff]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setStatusVariant("info");
    setStatusMessage("Submitting your journal entry...");
    setError(null);

    try {
      const { entry } = await apiClient.post("/journal-entries", payload, token);
      setEntries((prev) => [entry, ...prev]);
      const dash = await apiClient.get("/dashboard/journaler", token);
      setDashboard(dash);
      setStatusVariant("success");
      setStatusMessage("Journal entry saved.");
      setFormResetKey((prev) => prev + 1);
    } catch (err) {
      setStatusVariant("info");
      setStatusMessage(null);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !dashboard) {
    return <LoadingState label="Loading dashboard" />;
  }

  return (
    <div className="dashboard-page">
      <SectionCard
        title={`Welcome back, ${user?.name || "friend"}`}
        subtitle="Your emotional landscape at a glance"
      >
        {error && <p className="form-error">{error}</p>}
        {dashboard ? (
          <div className="metrics-grid">
            <MetricCard
              title="Reflection streak"
              value={`${dashboard.streak || 0} days`}
              description="How many consecutive days you've checked in."
            />
            <MetricCard
              title="Average mood"
              value={dashboard.averageMood ? dashboard.averageMood.toFixed(2) : "—"}
              description={dashboard.moodDescriptor?.message}
            />
            <MetricCard
              title="Weekly rhythm"
              value={`${dashboard.stats?.consistency || 0} entries / week`}
              description="Keep showing up—tiny notes become growth rings."
            />
          </div>
        ) : (
          <p className="empty-state">Submit an entry to unlock insights.</p>
        )}
      </SectionCard>

      <div className="dashboard-grid">
        <SectionCard
          title="Daily reflection"
          subtitle="Root yourself with the default Aleya prompt or a mentor form"
          action={
            forms.length > 1 && (
              <select
                value={selectedFormId || ""}
                onChange={(event) => setSelectedFormId(Number(event.target.value))}
              >
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>
            )
          }
        >
          <JournalEntryForm
            key={`${selectedFormId || "default"}-${formResetKey}`}
            form={selectedForm}
            onSubmit={handleSubmit}
            submitting={submitting}
            statusMessage={statusMessage}
            statusVariant={statusVariant}
          />
        </SectionCard>

        <SectionCard
          title="Mood trend"
          subtitle="Last reflections in a glance"
          action={
            <select
              className="compact-select"
              aria-label="Filter journal data by timeframe"
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value)}
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          }
        >
          {dashboard?.trend?.length ? (
            filteredTrend.length ? (
              <MoodTrendChart data={filteredTrend} />
            ) : (
              <p className="empty-state">
                No mood entries in this timeframe yet. Try a different filter to review
                earlier reflections.
              </p>
            )
          ) : (
            <p className="empty-state">
              The chart grows after your first few entries.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recent entries" subtitle="Revisit your notes and growth moments">
        {filteredEntries.length ? (
          <div className="entry-grid">
            {filteredEntries.slice(0, 6).map((entry) => (
              <article key={entry.id} className="entry-card">
                <header>
                  <span className={`badge badge-${entry.mood || "neutral"}`}>
                    {entry.mood || "No mood"}
                  </span>
                  <time dateTime={entry.entryDate}>
                    {format(parseISO(entry.entryDate), "MMM d, yyyy")}
                  </time>
                </header>
                {entry.summary && <p className="entry-summary">{entry.summary}</p>}
                {Array.isArray(entry.responses) && (
                  <ul className="entry-responses">
                    {entry.responses.slice(0, 3).map((response) => (
                      <li key={response.fieldId || response.label}>
                        <span>{response.label}:</span> {String(response.value || "")}
                      </li>
                    ))}
                  </ul>
                )}
                <footer>
                  <span className={`chip chip-${entry.sharedLevel}`}>
                    {entry.sharedLevel} share
                  </span>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {entries.length
              ? "No entries in this timeframe yet. Adjust the filter to revisit earlier notes."
              : "Your journal is waiting. Capture today's mood to begin your tree-ring."}
          </p>
        )}
      </SectionCard>
    </div>
  );
}

export default JournalerDashboard;
