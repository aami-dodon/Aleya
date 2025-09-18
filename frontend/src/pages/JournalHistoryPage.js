import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import JournalEntryForm from "../components/JournalEntryForm";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  bodySmallTextClasses,
  chipBaseClasses,
  emptyStateClasses,
  formLabelClasses,
  getMoodBadgeClasses,
  inputCompactClasses,
  mutedTextClasses,
  primaryButtonClasses,
  selectCompactClasses,
  smallHeadingClasses,
  subtleButtonClasses,
} from "../styles/ui";

const SLEEP_FIELD_MATCHERS = ["sleep quality"];
const ENERGY_FIELD_MATCHERS = ["energy level"];

function formatDateLabel(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return format(date, "MMMM d, yyyy");
}

function findResponseValue(entry, matchers = []) {
  if (!entry || !Array.isArray(entry.responses)) {
    return null;
  }

  const lowered = matchers.map((matcher) => matcher.toLowerCase());
  const target = entry.responses.find((response) => {
    const label = response.label?.toString().toLowerCase();
    if (!label) {
      return false;
    }
    return lowered.some((matcher) => label.includes(matcher));
  });

  if (target === undefined || target === null) {
    return null;
  }

  const value = target.value;
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? value.trim() : value;
}

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
  const [moodFilter, setMoodFilter] = useState("");
  const [sleepFilter, setSleepFilter] = useState("");
  const [energyFilter, setEnergyFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const editingEntryRef = useRef(null);
  const [formActionMessage, setFormActionMessage] = useState(null);
  const [formActionVariant, setFormActionVariant] = useState("success");
  const [unlinkingId, setUnlinkingId] = useState(null);
  const [formsError, setFormsError] = useState(null);

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
          setFormsError(null);
        }
      } catch (err) {
        if (isActive) {
          setForms([]);
          setFormsError(err.message);
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

  useEffect(() => {
    if (!formActionMessage) {
      return undefined;
    }

    const timeout = setTimeout(() => setFormActionMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [formActionMessage]);

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

  const handleUnlinkForm = useCallback(
    async (formId) => {
      if (!formId) {
        return;
      }

      try {
        setUnlinkingId(formId);
        setFormActionMessage(null);
        setFormActionVariant("success");
        await apiClient.del(`/forms/${formId}/assignment`, token);
        setForms((prev) => prev.filter((form) => form.id !== formId));
        setFormActionVariant("success");
        setFormActionMessage("Form unlinked.");
      } catch (err) {
        setFormActionVariant("error");
        setFormActionMessage(err.message);
      } finally {
        setUnlinkingId(null);
      }
    },
    [token]
  );

  const sortedForms = useMemo(() => {
    if (!Array.isArray(forms)) {
      return [];
    }

    return [...forms].sort((a, b) => {
      if (a.is_default === b.is_default) {
        return 0;
      }
      return a.is_default ? -1 : 1;
    });
  }, [forms]);

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

  const availableMoods = useMemo(() => {
    const set = new Set();
    entries.forEach((entry) => {
      if (entry.mood) {
        set.add(entry.mood);
      }
    });
    return Array.from(set).sort((a, b) =>
      a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
    );
  }, [entries]);

  const availableSleepLevels = useMemo(() => {
    const set = new Set();
    entries.forEach((entry) => {
      const value = findResponseValue(entry, SLEEP_FIELD_MATCHERS);
      if (value !== null && value !== "") {
        const label = typeof value === "string" ? value : String(value);
        if (label.trim()) {
          set.add(label.trim());
        }
      }
    });
    return Array.from(set).sort((a, b) =>
      a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
    );
  }, [entries]);

  const availableEnergyLevels = useMemo(() => {
    const set = new Set();
    entries.forEach((entry) => {
      const value = findResponseValue(entry, ENERGY_FIELD_MATCHERS);
      if (value !== null && value !== "") {
        const label = typeof value === "string" ? value : String(value);
        if (label.trim()) {
          set.add(label.trim());
        }
      }
    });
    return Array.from(set).sort((a, b) =>
      a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
    );
  }, [entries]);

  const availableForms = useMemo(() => {
    const set = new Set();
    entries.forEach((entry) => {
      if (entry.formTitle) {
        set.add(entry.formTitle.trim());
      }
    });
    return Array.from(set).sort((a, b) =>
      a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" })
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (moodFilter && entry.mood !== moodFilter) {
        return false;
      }

      if (formFilter && entry.formTitle?.trim() !== formFilter) {
        return false;
      }

      const sleepValue = findResponseValue(entry, SLEEP_FIELD_MATCHERS);
      if (
        sleepFilter &&
        (!sleepValue ||
          sleepValue.toString().toLowerCase() !== sleepFilter.toLowerCase())
      ) {
        return false;
      }

      const energyValue = findResponseValue(entry, ENERGY_FIELD_MATCHERS);
      if (
        energyFilter &&
        (!energyValue ||
          energyValue.toString().toLowerCase() !== energyFilter.toLowerCase())
      ) {
        return false;
      }

      const entryDate = parseISO(entry.entryDate);
      if (startDate) {
        const fromDate = parseISO(startDate);
        if (entryDate < fromDate) {
          return false;
        }
      }

      if (endDate) {
        const toDate = parseISO(endDate);
        if (entryDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [entries, energyFilter, formFilter, moodFilter, sleepFilter, startDate, endDate]);

  const filtersActive = useMemo(
    () =>
      Boolean(
        moodFilter ||
          sleepFilter ||
          energyFilter ||
          formFilter ||
          startDate ||
          endDate
      ),
    [moodFilter, sleepFilter, energyFilter, formFilter, startDate, endDate]
  );

  const handleResetFilters = useCallback(() => {
    setMoodFilter("");
    setSleepFilter("");
    setEnergyFilter("");
    setFormFilter("");
    setStartDate("");
    setEndDate("");
  }, []);

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
      {user.role === "journaler" && (
        <SectionCard
          title="Your check-in forms"
          subtitle="See the prompts you've chosen to reflect with"
        >
          {formsError && (
            <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
              {formsError}
            </p>
          )}
          {formActionMessage && (
            <p
              className={`rounded-2xl px-4 py-3 ${bodySmallStrongTextClasses} ${
                formActionVariant === "success"
                  ? "border border-emerald-100 bg-emerald-50/80 text-emerald-700"
                  : "border border-rose-100 bg-rose-50/80 text-rose-600"
              }`}
            >
              {formActionMessage}
            </p>
          )}
          {sortedForms.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {sortedForms.map((form) => {
                const fieldCount = Array.isArray(form.fields)
                  ? form.fields.length
                  : 0;
                const mentorName = form.assignment?.mentorName || "—";
                const assignedDate = formatDateLabel(
                  form.assignment?.assignedAt
                );
                const createdDate = formatDateLabel(form.created_at);
                const timingLabel = form.is_default
                  ? createdDate
                  : assignedDate || createdDate;
                const visibilityLabel = form.is_default
                  ? "Default"
                  : form.visibility
                  ? `${form.visibility.charAt(0).toUpperCase()}${form.visibility
                      .slice(1)
                      .toLowerCase()}`
                  : "—";

                return (
                  <li
                    key={form.id}
                    className="space-y-4 rounded-2xl border border-emerald-100 bg-white/70 p-5 shadow-inner shadow-emerald-900/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className={`${smallHeadingClasses} text-emerald-900`}>
                          {form.title}
                        </h3>
                        {form.description ? (
                          <p
                            className={`${bodySmallMutedTextClasses} text-emerald-900/70`}
                          >
                            {form.description}
                          </p>
                        ) : (
                          <p className={`${mutedTextClasses} text-sm`}>
                            No description provided.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`${chipBaseClasses} ${
                            form.is_default
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {form.is_default ? "Default form" : "Assigned form"}
                        </span>
                        {!form.is_default && (
                          <button
                            type="button"
                            className={`${subtleButtonClasses} text-sm text-rose-600 hover:text-rose-500`}
                            onClick={() => handleUnlinkForm(form.id)}
                            disabled={unlinkingId === form.id}
                          >
                            {unlinkingId === form.id ? "Unlinking..." : "Unlink"}
                          </button>
                        )}
                      </div>
                    </div>
                    <dl className="grid gap-3 text-sm text-emerald-900/70 sm:grid-cols-2">
                      <div className="space-y-0.5">
                        <dt className={`${bodySmallStrongTextClasses} text-emerald-900`}>
                          Prompts
                        </dt>
                        <dd className={bodySmallTextClasses}>{fieldCount}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className={`${bodySmallStrongTextClasses} text-emerald-900`}>
                          Visibility
                        </dt>
                        <dd className={bodySmallTextClasses}>{visibilityLabel}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className={`${bodySmallStrongTextClasses} text-emerald-900`}>
                          Mentor
                        </dt>
                        <dd className={bodySmallTextClasses}>{mentorName}</dd>
                      </div>
                      <div className="space-y-0.5">
                        <dt className={`${bodySmallStrongTextClasses} text-emerald-900`}>
                          {form.is_default ? "Available since" : "Assigned on"}
                        </dt>
                        <dd className={bodySmallTextClasses}>
                          {timingLabel || "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="flex flex-col gap-3 border-t border-emerald-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                        Let this form guide a fresh reflection beneath today’s canopy.
                      </p>
                      <Link
                        to={`/dashboard?formId=${form.id}`}
                        className={`${primaryButtonClasses} w-full text-center sm:w-auto`}
                      >
                        Bloom
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={emptyStateClasses}>
              No forms are linked yet. Ask your mentor to share one with you.
            </p>
          )}
        </SectionCard>
      )}
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
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-white/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={`${smallHeadingClasses} text-emerald-900`}>
              Filter entries
            </h3>
            {filtersActive && (
              <button
                type="button"
                className={`${subtleButtonClasses} text-sm`}
                onClick={handleResetFilters}
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-mood" className={`block ${formLabelClasses}`}>
                Mood
              </label>
              <select
                id="filter-mood"
                className={`${selectCompactClasses} w-full`}
                value={moodFilter}
                onChange={(event) => setMoodFilter(event.target.value)}
              >
                <option value="">All moods</option>
                {availableMoods.map((mood) => (
                  <option key={mood} value={mood}>
                    {mood}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-sleep"
                className={`block ${formLabelClasses}`}
              >
                Sleep quality
              </label>
              <select
                id="filter-sleep"
                className={`${selectCompactClasses} w-full`}
                value={sleepFilter}
                onChange={(event) => setSleepFilter(event.target.value)}
              >
                <option value="">All sleep quality</option>
                {availableSleepLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-energy"
                className={`block ${formLabelClasses}`}
              >
                Energy level
              </label>
              <select
                id="filter-energy"
                className={`${selectCompactClasses} w-full`}
                value={energyFilter}
                onChange={(event) => setEnergyFilter(event.target.value)}
              >
                <option value="">All energy levels</option>
                {availableEnergyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-form"
                className={`block ${formLabelClasses}`}
              >
                Form name
              </label>
              <select
                id="filter-form"
                className={`${selectCompactClasses} w-full`}
                value={formFilter}
                onChange={(event) => setFormFilter(event.target.value)}
              >
                <option value="">All forms</option>
                {availableForms.map((formName) => (
                  <option key={formName} value={formName}>
                    {formName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-start-date"
                className={`block ${formLabelClasses}`}
              >
                From date
              </label>
              <input
                id="filter-start-date"
                type="date"
                className={`${inputCompactClasses} w-full`}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-end-date"
                className={`block ${formLabelClasses}`}
              >
                To date
              </label>
              <input
                id="filter-end-date"
                type="date"
                className={`${inputCompactClasses} w-full`}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
        </div>
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
          filteredEntries.length ? (
            <ul className="grid gap-4">
              {filteredEntries.map((entry) => (
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
            <p className={emptyStateClasses}>
              No entries match the selected filters.
            </p>
          )
        ) : (
          <p className={emptyStateClasses}>No entries available yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default JournalHistoryPage;
