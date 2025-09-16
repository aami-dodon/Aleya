import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

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
    <div className="dashboard-page">
      <SectionCard
        title="Journal history"
        subtitle="Browse past reflections and notice patterns"
        action={
          user.role === "mentor" && (
            <select
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
        {error && <p className="form-error">{error}</p>}
        {entries.length ? (
          <ul className="history-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <header>
                  <span className={`badge badge-${entry.mood || "neutral"}`}>
                    {entry.mood || "No mood"}
                  </span>
                  <time dateTime={entry.entryDate}>
                    {format(parseISO(entry.entryDate), "MMMM d, yyyy")}
                  </time>
                  <span className="chip">{entry.formTitle}</span>
                </header>
                {entry.summary && <p>{entry.summary}</p>}
                {Array.isArray(entry.responses) && entry.responses.length > 0 && (
                  <details>
                    <summary>View responses</summary>
                    <ul className="entry-responses">
                      {entry.responses.map((response) => (
                        <li key={response.fieldId || response.label}>
                          <strong>{response.label}:</strong> {String(response.value || "")}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No entries available yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default JournalHistoryPage;
