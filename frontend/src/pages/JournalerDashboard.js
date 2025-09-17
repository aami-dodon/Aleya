import { format, isAfter, isEqual, parseISO, subMonths, subWeeks } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import JournalEntryForm from "../components/JournalEntryForm";
import LoadingState from "../components/LoadingState";
import MetricCard from "../components/MetricCard";
import MoodTrendChart from "../components/MoodTrendChart";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  bodySmallMutedTextClasses,
  emptyStateClasses,
  getMoodBadgeClasses,
  getShareChipClasses,
  selectCompactClasses,
  smallHeadingClasses,
} from "../styles/ui";

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

  const filteredMoodTrend = useMemo(
    () => filterTrendData(dashboard?.trend || [], timeframeCutoff),
    [dashboard?.trend, timeframeCutoff]
  );

  const filteredSleepTrend = useMemo(
    () => filterTrendData(dashboard?.sleepTrend || [], timeframeCutoff),
    [dashboard?.sleepTrend, timeframeCutoff]
  );

  const filteredEnergyTrend = useMemo(
    () => filterTrendData(dashboard?.energyTrend || [], timeframeCutoff),
    [dashboard?.energyTrend, timeframeCutoff]
  );

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
    <div className="flex w-full flex-1 flex-col gap-8">
      <SectionCard
        title={`Welcome back, ${user?.name || "friend"}`}
        subtitle="Your emotional landscape at a glance"
      >
        {error && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </p>
        )}
        {dashboard ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <p className={emptyStateClasses}>Submit an entry to unlock insights.</p>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Daily reflection"
          subtitle="Root yourself with the default Aleya prompt or a mentor form"
          action={
            forms.length > 1 && (
              <select
                className={`${selectCompactClasses} w-full md:w-56`}
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
              className={`${selectCompactClasses} w-full md:w-40`}
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
            filteredMoodTrend.length ? (
              <MoodTrendChart data={filteredMoodTrend} />
            ) : (
              <p className={emptyStateClasses}>
                No mood entries in this timeframe yet. Try a different filter to review
                earlier reflections.
              </p>
            )
          ) : (
            <p className={emptyStateClasses}>
              The chart grows after your first few entries.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Sleep and energy"
        subtitle="Notice how rest and vitality shift alongside your reflections"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className={`${smallHeadingClasses} text-emerald-900`}>Sleep quality</p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Log how you slept each day to observe restorative patterns.
              </p>
            </div>
            {dashboard?.sleepTrend?.length ? (
              filteredSleepTrend.length ? (
                <MoodTrendChart data={filteredSleepTrend} />
              ) : (
                <p className={emptyStateClasses}>
                  No sleep entries in this timeframe yet. Try a different filter to review
                  earlier rest notes.
                </p>
              )
            ) : (
              <p className={emptyStateClasses}>
                Track your rest by adding sleep quality when you journal.
              </p>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className={`${smallHeadingClasses} text-emerald-900`}>Energy level</p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Capture how energized you feel to spot ebb-and-flow trends.
              </p>
            </div>
            {dashboard?.energyTrend?.length ? (
              filteredEnergyTrend.length ? (
                <MoodTrendChart data={filteredEnergyTrend} />
              ) : (
                <p className={emptyStateClasses}>
                  No energy entries in this timeframe yet. Try a different filter to explore
                  earlier check-ins.
                </p>
              )
            ) : (
              <p className={emptyStateClasses}>
                Note your energy levels in the form to unlock this insight.
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recent entries" subtitle="Revisit your notes and growth moments">
        {filteredEntries.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEntries.slice(0, 6).map((entry) => (
              <article
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-5 shadow-inner shadow-emerald-900/5"
              >
                <header className="flex items-center justify-between gap-3">
                  <span className={getMoodBadgeClasses(entry.mood)}>
                    {entry.mood || "No mood"}
                  </span>
                  <time
                    dateTime={entry.entryDate}
                    className="text-sm font-medium text-emerald-900/70"
                  >
                    {format(parseISO(entry.entryDate), "MMM d, yyyy")}
                  </time>
                </header>
                {entry.summary && (
                  <p className="text-sm text-emerald-900/80">{entry.summary}</p>
                )}
                {Array.isArray(entry.responses) && (
                  <ul className="grid gap-1 text-sm text-emerald-900/70">
                    {entry.responses.slice(0, 3).map((response) => (
                      <li key={response.fieldId || response.label}>
                        <span className="font-semibold text-emerald-900">
                          {response.label}:
                        </span>{" "}
                        {String(response.value || "")}
                      </li>
                    ))}
                  </ul>
                )}
                <footer>
                  <span className={getShareChipClasses(entry.sharedLevel)}>
                    {entry.sharedLevel} share
                  </span>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <p className={emptyStateClasses}>
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

function filterTrendData(data = [], cutoff) {
  if (!Array.isArray(data) || !data.length) {
    return [];
  }

  if (!cutoff) {
    return data;
  }

  return data.filter((point) => {
    if (!point?.date) {
      return false;
    }

    const pointDate = parseISO(point.date);
    if (Number.isNaN(pointDate.getTime())) {
      return false;
    }

    return isAfter(pointDate, cutoff) || isEqual(pointDate, cutoff);
  });
}
