import { format, isAfter, isEqual, parseISO, subMonths, subWeeks } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import JournalEntryForm from "../components/JournalEntryForm";
import LoadingState from "../components/LoadingState";
import MetricCard from "../components/MetricCard";
import MoodTrendChart from "../components/MoodTrendChart";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  emptyStateClasses,
  getMoodBadgeClasses,
  getShareChipClasses,
  selectCompactClasses,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusVariant, setStatusVariant] = useState("info");
  const [timeframe, setTimeframe] = useState("week");
  const [formResetKey, setFormResetKey] = useState(0);

  const requestedFormId = searchParams.get("formId");
  const requestedFormIdNumber = useMemo(() => {
    if (!requestedFormId) {
      return null;
    }

    const parsed = Number(requestedFormId);
    return Number.isNaN(parsed) ? null : parsed;
  }, [requestedFormId]);

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

        const nextForms = formsRes.forms || [];
        setForms(nextForms);
        setDashboard(dashRes);
        setEntries(entriesRes.entries || []);
        setError(null);

        const hasForms = nextForms.length > 0;
        const requestedExists = requestedFormIdNumber
          ? nextForms.some((form) => form.id === requestedFormIdNumber)
          : false;

        if (requestedExists && selectedFormId !== requestedFormIdNumber) {
          setSelectedFormId(requestedFormIdNumber);
        } else if (!selectedFormId && hasForms) {
          setSelectedFormId(nextForms[0].id);
        } else if (requestedFormId && !requestedExists) {
          const next = new URLSearchParams(searchParams);
          next.delete("formId");
          setSearchParams(next, { replace: true });
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
  }, [
    token,
    selectedFormId,
    requestedFormId,
    requestedFormIdNumber,
    searchParams,
    setSearchParams,
  ]);

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

  useEffect(() => {
    if (!selectedFormId) {
      if (!requestedFormId) {
        return;
      }

      const next = new URLSearchParams(searchParams);
      next.delete("formId");
      setSearchParams(next, { replace: true });
      return;
    }

    if (requestedFormId === String(selectedFormId)) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set("formId", selectedFormId);
    setSearchParams(next, { replace: true });
  }, [requestedFormId, searchParams, selectedFormId, setSearchParams]);

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
    setStatusMessage("Sending your reflection into the grove...");
    setError(null);

    try {
      const { entry } = await apiClient.post("/journal-entries", payload, token);
      setEntries((prev) => [entry, ...prev]);
      const dash = await apiClient.get("/dashboard/journaler", token);
      setDashboard(dash);
      setStatusVariant("success");
      setStatusMessage("Your reflection now sings within Aleya.");
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
    return <LoadingState label="Illuminating your canopy" />;
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      <SectionCard
        title={`Welcome back, ${user?.name || "friend"}`}
        subtitle="Your luminous landscape gathered in one glance"
      >
        {error && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </p>
        )}
        {dashboard ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Reflection rings"
              value={`${dashboard.streak || 0} days`}
              description="Consecutive days you've whispered into your journal."
            />
            <MetricCard
              title="Average mood"
              value={dashboard.averageMood ? dashboard.averageMood.toFixed(2) : "—"}
              description={dashboard.moodDescriptor?.message}
            />
            <MetricCard
              title="Weekly rhythm"
              value={`${dashboard.stats?.consistency || 0} entries / week`}
              description="Return often—small notes become the rings of your tree."
            />
          </div>
        ) : (
          <p className={emptyStateClasses}>Offer today’s reflection to awaken your insights.</p>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
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

        <div className="flex flex-col gap-6">
          <SectionCard
            title="Mood constellations"
            subtitle="Recent reflections traced across time"
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
                  No moods appear in this window yet. Try another filter to revisit earlier constellations.
                </p>
              )
            ) : (
              <p className={emptyStateClasses}>
                The chart will glow once your first few entries take root.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Sleep quality"
            subtitle="Log your rest each day to notice restorative tides."
          >
            {dashboard?.sleepTrend?.length ? (
              filteredSleepTrend.length ? (
                <MoodTrendChart data={filteredSleepTrend} />
              ) : (
                <p className={emptyStateClasses}>
                  No rest notes live in this window yet. Adjust the filter to revisit earlier dreams.
                </p>
              )
            ) : (
              <p className={emptyStateClasses}>
                Invite rest into view by noting sleep quality as you journal.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Energy tide"
            subtitle="Capture how your spark rises and softens over time."
          >
            {dashboard?.energyTrend?.length ? (
              filteredEnergyTrend.length ? (
                <MoodTrendChart data={filteredEnergyTrend} />
              ) : (
                <p className={emptyStateClasses}>
                  No energy notes appear in this window. Adjust the filter to explore earlier currents.
                </p>
              )
            ) : (
              <p className={emptyStateClasses}>
                Record your energy in each form to awaken this insight.
              </p>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Recent entries" subtitle="Revisit the notes and growth rings you’ve gathered">
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
              ? "No entries shine in this window yet. Adjust the filter to revisit earlier notes."
              : "Your journal is waiting. Capture today’s mood to grow your first ring."}
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
