import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  chipBaseClasses,
  emptyStateClasses,
  getMoodBadgeClasses,
  selectCompactClasses,
} from "../styles/ui";

function JournalHistoryPage() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEntries = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      if (user.role === "mentor") {
        const menteesRes = await apiClient.get("/mentors/mentees", token);
        setMentees(menteesRes.mentees || []);
      }
      const path =
        user.role === "mentor" && selectedMentee
          ? `/journal-entries?journalerId=${selectedMentee}`
          : "/journal-entries";
      const response = await apiClient.get(path, token);
      setEntries(response.entries || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMentee, token, user.role]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  if (loading) {
    return <LoadingState label="Fetching entries" />;
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      <SectionCard
        title="Journal history"
        subtitle="Browse past reflections and notice patterns"
        action={
          user.role === "mentor" && (
            <select
              className={`${selectCompactClasses} w-full md:w-56`}
              value={selectedMentee}
              onChange={(event) => setSelectedMentee(event.target.value)}
            >
              <option value="">Select mentee</option>
              {mentees.map((mentee) => (
                <option key={mentee.id} value={mentee.id}>
                  {mentee.name}
                </option>
              ))}
            </select>
          )
        }
      >
        {error && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </p>
        )}
        {entries.length ? (
          <ul className="grid gap-4">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="space-y-3 rounded-2xl border border-emerald-100 bg-white/70 p-5 shadow-inner shadow-emerald-900/5"
              >
                <header className="flex flex-wrap items-center gap-3">
                  <span className={getMoodBadgeClasses(entry.mood)}>
                    {entry.mood || "No mood"}
                  </span>
                  <time
                    dateTime={entry.entryDate}
                    className="text-sm font-medium text-emerald-900/70"
                  >
                    {format(parseISO(entry.entryDate), "MMMM d, yyyy")}
                  </time>
                  <span className={`${chipBaseClasses} normal-case`}>{entry.formTitle}</span>
                </header>
                {entry.summary && (
                  <p className="text-sm text-emerald-900/80">{entry.summary}</p>
                )}
                {Array.isArray(entry.responses) && entry.responses.length > 0 && (
                  <details className="rounded-2xl border border-emerald-100 bg-white/60 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-emerald-900">
                      View responses
                    </summary>
                    <ul className="mt-3 grid gap-2 text-sm text-emerald-900/70">
                      {entry.responses.map((response) => (
                        <li key={response.fieldId || response.label}>
                          <span className="font-semibold text-emerald-900">
                            {response.label}:
                          </span>{" "}
                          {String(response.value || "")}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={emptyStateClasses}>No entries available yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default JournalHistoryPage;
