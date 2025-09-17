import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import JournalEntryForm from "../components/JournalEntryForm";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  chipBaseClasses,
  emptyStateClasses,
  getMoodBadgeClasses,
  selectCompactClasses,
  smallHeadingClasses,
  subtleButtonClasses,
} from "../styles/ui";

function JournalHistoryPage() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forms, setForms] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionVariant, setActionVariant] = useState("success");
  const editingEntryRef = useRef(null);

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

  useEffect(() => {
    if (user.role !== "journaler" || !token) {
      return;
    }

    let isActive = true;

    const loadForms = async () => {
      try {
        const response = await apiClient.get("/forms", token);
        if (isActive) {
          setForms(response.forms || []);
        }
      } catch (err) {
        if (isActive) {
          setForms([]);
        }
      }
    };

    loadForms();
    return () => {
      isActive = false;
    };
  }, [token, user.role]);

  useEffect(() => {
    if (!actionMessage) {
      return undefined;
    }

    const timeout = setTimeout(() => setActionMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [actionMessage]);

  const editingForm = useMemo(() => {
    if (!editingEntry) {
      return null;
    }
    return forms.find((form) => form.id === editingEntry.formId) || null;
  }, [editingEntry, forms]);

  const editingValues = useMemo(() => {
    if (!editingEntry || !editingForm) {
      return {};
    }

    const mapped = {};
    (editingForm.fields || []).forEach((field) => {
      const key = field.id ?? field.label;
      const response = (editingEntry.responses || []).find((item) => {
        if (field.id && item.fieldId) {
          return item.fieldId === field.id;
        }
        return item.label === field.label;
      });
      mapped[key] = response?.value ?? "";
    });
    return mapped;
  }, [editingEntry, editingForm]);

  const handleEditEntry = useCallback((entry) => {
    setEditingEntry(entry);
    setActionMessage(null);
    setActionVariant("success");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingEntry(null);
  }, []);

  useEffect(() => {
    if (!editingEntry || !editingEntryRef.current) {
      return;
    }

    editingEntryRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [editingEntry]);

  const handleUpdateEntry = useCallback(
    async (payload) => {
      if (!editingEntry) {
        return;
      }

      try {
        setUpdating(true);
        setActionMessage(null);
        const { entry } = await apiClient.patch(
          `/journal-entries/${editingEntry.id}`,
          payload,
          token
        );
        setEntries((prev) =>
          prev.map((item) => (item.id === entry.id ? entry : item))
        );
        setActionVariant("success");
        setActionMessage("Entry updated.");
        setEditingEntry(null);
      } catch (err) {
        setActionVariant("error");
        setActionMessage(err.message);
      } finally {
        setUpdating(false);
      }
    },
    [editingEntry, token]
  );

  const handleDeleteEntry = useCallback(
    async (entryId) => {
      if (!token) return;
      const confirmed = window.confirm(
        "Are you sure you want to delete this entry? This action cannot be undone."
      );
      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(entryId);
        setActionMessage(null);
        await apiClient.del(`/journal-entries/${entryId}`, token);
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        if (editingEntry?.id === entryId) {
          setEditingEntry(null);
        }
        setActionVariant("success");
        setActionMessage("Entry deleted.");
      } catch (err) {
        setActionVariant("error");
        setActionMessage(err.message);
      } finally {
        setDeletingId(null);
      }
    },
    [editingEntry, token]
  );

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
        {actionMessage && (
          <p
            className={`rounded-2xl px-4 py-3 ${bodySmallStrongTextClasses} ${
              actionVariant === "success"
                ? "border border-emerald-100 bg-emerald-50/80 text-emerald-700"
                : "border border-rose-100 bg-rose-50/80 text-rose-600"
            }`}
          >
            {actionMessage}
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
                {user.role === "journaler" && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      className={`${subtleButtonClasses} text-sm`}
                      onClick={() => handleEditEntry(entry)}
                    >
                      Edit entry
                    </button>
                    <button
                      type="button"
                      className={`${subtleButtonClasses} text-sm text-rose-600 hover:text-rose-500`}
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
                {user.role === "journaler" && editingEntry?.id === entry.id && (
                  <div
                    ref={editingEntryRef}
                    className="mt-4 space-y-3 rounded-2xl border border-emerald-100 bg-white/80 p-5"
                  >
                    <div className="space-y-1">
                      <h3 className={`${smallHeadingClasses} text-emerald-900`}>
                        Edit journal entry
                      </h3>
                      <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                        Update your reflection from {" "}
                        {format(parseISO(editingEntry.entryDate), "MMMM d, yyyy")}.
                      </p>
                    </div>
                    {editingForm ? (
                      <JournalEntryForm
                        form={editingForm}
                        submitting={updating}
                        onSubmit={handleUpdateEntry}
                        onCancel={handleCancelEdit}
                        initialSharing={editingEntry.sharedLevel}
                        initialValues={editingValues}
                        submitLabel="Update entry"
                      />
                    ) : (
                      <p className={emptyStateClasses}>
                        This form is no longer available for editing.
                      </p>
                    )}
                  </div>
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
