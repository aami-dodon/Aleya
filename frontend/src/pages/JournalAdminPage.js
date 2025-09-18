import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  chipBaseClasses,
  dangerButtonClasses,
  emptyStateClasses,
  infoTextClasses,
  inputCompactClasses,
  mutedTextClasses,
  secondaryButtonClasses,
  selectCompactClasses,
  subtleButtonClasses,
  tableHeaderClasses,
  tableRowClasses,
} from "../styles/ui";

const SHARED_LEVEL_OPTIONS = ["all", "private", "mood", "summary", "full"];

const sharedLevelSet = new Set(SHARED_LEVEL_OPTIONS);

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  try {
    return dateTimeFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function JournalAdminPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsString = searchParams.toString();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") || "");
  const [sharedLevelFilter, setSharedLevelFilter] = useState(() => {
    const param = searchParams.get("sharedLevel") || "all";
    return sharedLevelSet.has(param) ? param : "all";
  });
  const [moodFilter, setMoodFilter] = useState(
    () => searchParams.get("mood") || "all"
  );
  const [journalerFilter, setJournalerFilter] = useState(
    () => searchParams.get("journalerId") || ""
  );
  const [mentorFilter, setMentorFilter] = useState(
    () => searchParams.get("mentorId") || ""
  );

  useEffect(() => {
    const nextSearch = searchParams.get("q") || "";
    if (nextSearch !== searchTerm) {
      setSearchTerm(nextSearch);
    }

    const sharedParam = searchParams.get("sharedLevel") || "all";
    const normalizedShared = sharedLevelSet.has(sharedParam)
      ? sharedParam
      : "all";
    if (normalizedShared !== sharedLevelFilter) {
      setSharedLevelFilter(normalizedShared);
    }

    const nextMood = searchParams.get("mood") || "all";
    if (nextMood !== moodFilter) {
      setMoodFilter(nextMood);
    }

    const nextJournaler = searchParams.get("journalerId") || "";
    if (nextJournaler !== journalerFilter) {
      setJournalerFilter(nextJournaler);
    }

    const nextMentor = searchParams.get("mentorId") || "";
    if (nextMentor !== mentorFilter) {
      setMentorFilter(nextMentor);
    }
  }, [journalerFilter, mentorFilter, moodFilter, paramsString, searchParams, searchTerm, sharedLevelFilter]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;

    const loadEntries = async () => {
      setLoading(true);
      try {
        const query = paramsString ? `?${paramsString}` : "";
        const res = await apiClient.get(`/admin/journals${query}`, token);

        if (!isActive) {
          return;
        }

        setEntries(res.entries || []);
        setMessage(null);
      } catch (error) {
        if (isActive) {
          setMessage(error.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadEntries();

    return () => {
      isActive = false;
    };
  }, [paramsString, reloadKey, token]);

  const applyFilters = useCallback(
    (overrides = {}) => {
      const normalizedSearch = (overrides.searchTerm ?? searchTerm)
        .trim()
        .toLowerCase();
      const nextShared = overrides.sharedLevel ?? sharedLevelFilter;
      const nextMood = overrides.mood ?? moodFilter;
      const nextJournaler = overrides.journaler ?? journalerFilter;
      const nextMentor = overrides.mentor ?? mentorFilter;

      const nextParams = new URLSearchParams();

      if (normalizedSearch) {
        nextParams.set("q", normalizedSearch);
      }

      if (nextShared && nextShared !== "all") {
        nextParams.set("sharedLevel", nextShared);
      }

      if (nextMood && nextMood !== "all") {
        nextParams.set("mood", nextMood);
      }

      if (nextJournaler) {
        nextParams.set("journalerId", nextJournaler);
      }

      if (nextMentor) {
        nextParams.set("mentorId", nextMentor);
      }

      const nextString = nextParams.toString();
      if (nextString !== paramsString) {
        setSearchParams(nextParams);
      }
    },
    [
      journalerFilter,
      mentorFilter,
      moodFilter,
      paramsString,
      searchTerm,
      setSearchParams,
      sharedLevelFilter,
    ]
  );

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    applyFilters();
  };

  const handleSharedLevelChange = (value) => {
    setSharedLevelFilter(value);
    applyFilters({ sharedLevel: value });
  };

  const handleMoodChange = (value) => {
    setMoodFilter(value);
    applyFilters({ mood: value });
  };

  const handleJournalerChange = (value) => {
    setJournalerFilter(value);
    applyFilters({ journaler: value });
  };

  const handleMentorChange = (value) => {
    setMentorFilter(value);
    applyFilters({ mentor: value });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSharedLevelFilter("all");
    setMoodFilter("all");
    setJournalerFilter("");
    setMentorFilter("");
    if (paramsString) {
      setSearchParams({});
    }
  };

  const handleDeleteEntry = async (entry) => {
    const journalerName = entry?.journaler?.name || "this journal";
    const confirmed = window.confirm(
      `Remove ${journalerName}'s reflection? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.del(`/admin/journals/${entry.id}`, token);
      setMessage("Journal entry deleted.");
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const mentorOptions = useMemo(() => {
    const map = new Map();

    entries.forEach((entry) => {
      if (Array.isArray(entry.mentors)) {
        entry.mentors.forEach((mentor) => {
          if (!mentor?.id) {
            return;
          }

          const key = String(mentor.id);
          if (!map.has(key)) {
            map.set(key, mentor.name || mentor.email || `Mentor ${mentor.id}`);
          }
        });
      }
    });

    if (mentorFilter && !map.has(mentorFilter)) {
      map.set(mentorFilter, `Mentor ${mentorFilter}`);
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entries, mentorFilter]);

  const journalerOptions = useMemo(() => {
    const map = new Map();

    entries.forEach((entry) => {
      if (!entry?.journaler?.id) {
        return;
      }

      const key = String(entry.journaler.id);
      if (!map.has(key)) {
        map.set(
          key,
          entry.journaler.name || entry.journaler.email || `Journaler ${key}`
        );
      }
    });

    if (journalerFilter && !map.has(journalerFilter)) {
      map.set(journalerFilter, `Journaler ${journalerFilter}`);
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entries, journalerFilter]);

  const moodOptions = useMemo(() => {
    const set = new Set();

    entries.forEach((entry) => {
      if (entry.mood) {
        set.add(entry.mood);
      }
    });

    if (moodFilter && moodFilter !== "all") {
      set.add(moodFilter);
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries, moodFilter]);

  const filtersApplied =
    (searchTerm || "").trim().length > 0 ||
    sharedLevelFilter !== "all" ||
    (moodFilter && moodFilter !== "all") ||
    Boolean(journalerFilter) ||
    Boolean(mentorFilter);

  if (loading) {
    return <LoadingState label="Loading journals" />;
  }

  const tableGrid =
    "minmax(0, 1.6fr) minmax(0, 1.6fr) minmax(0, 0.9fr)";

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      {message && <p className={infoTextClasses}>{message}</p>}

      <SectionCard
        title="Journal library"
        subtitle="Search reflections, trace mentor ties, and retire entries that need to rest"
        action={
          <form
            className="flex flex-wrap items-center gap-3"
            onSubmit={handleFilterSubmit}
          >
            <label className="sr-only" htmlFor="journal-search">
              Search journals
            </label>
            <input
              id="journal-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by journaler, mentor, form, or summary"
              className={`${inputCompactClasses} w-full sm:w-64`}
            />
            <label className="sr-only" htmlFor="journal-shared-filter">
              Filter by sharing level
            </label>
            <select
              id="journal-shared-filter"
              className={`${selectCompactClasses} w-full sm:w-44`}
              value={sharedLevelFilter}
              onChange={(event) => handleSharedLevelChange(event.target.value)}
            >
              {SHARED_LEVEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All sharing" : option}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="journal-mood-filter">
              Filter by mood
            </label>
            <select
              id="journal-mood-filter"
              className={`${selectCompactClasses} w-full sm:w-44`}
              value={moodFilter}
              onChange={(event) => handleMoodChange(event.target.value)}
            >
              <option value="all">All moods</option>
              {moodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="journal-journaler-filter">
              Filter by journaler
            </label>
            <select
              id="journal-journaler-filter"
              className={`${selectCompactClasses} w-full sm:w-44`}
              value={journalerFilter}
              onChange={(event) => handleJournalerChange(event.target.value)}
            >
              <option value="">All journalers</option>
              {journalerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="journal-mentor-filter">
              Filter by mentor
            </label>
            <select
              id="journal-mentor-filter"
              className={`${selectCompactClasses} w-full sm:w-44`}
              value={mentorFilter}
              onChange={(event) => handleMentorChange(event.target.value)}
            >
              <option value="">All mentors</option>
              {mentorOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
            >
              Apply filters
            </button>
            <button
              type="button"
              className={`${subtleButtonClasses} px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60`}
              onClick={handleClearFilters}
              disabled={!filtersApplied}
            >
              Clear filters
            </button>
          </form>
        }
      >
        {entries.length ? (
          <div className="space-y-3">
            <div
              className={`${tableHeaderClasses} md:px-4`}
              style={{ "--table-grid": tableGrid }}
            >
              <span>Journaler</span>
              <span>Reflection</span>
              <span className="md:text-right">Actions</span>
            </div>
            {entries.map((entry) => {
              const mentorList = Array.isArray(entry.mentors)
                ? entry.mentors.filter((mentor) => mentor && mentor.id)
                : [];

              const createdLabel = formatDateTime(entry.createdAt);
              const entryDateLabel = formatDate(entry.entryDate);

              return (
                <div
                  key={entry.id}
                  className={tableRowClasses}
                  style={{ "--table-grid": tableGrid }}
                >
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-emerald-900">
                      {entry.journaler?.name || entry.journaler?.email || "Journaler"}
                    </p>
                    {entry.journaler?.email && (
                      <p className={infoTextClasses}>{entry.journaler.email}</p>
                    )}
                    <p className={`${mutedTextClasses} text-sm`}>
                      Logged {createdLabel}
                    </p>
                    {entryDateLabel && (
                      <p className={`${mutedTextClasses} text-sm`}>
                        Reflecting on {entryDateLabel}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {entry.form ? (
                        <p className="text-sm font-semibold text-emerald-900">
                          Form: {entry.form.title}
                        </p>
                      ) : (
                        <p className={`${mutedTextClasses} text-sm`}>
                          Form removed
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <span className={chipBaseClasses}>
                          Shared: {entry.sharedLevel}
                        </span>
                        {entry.mood && (
                          <span className={chipBaseClasses}>Mood: {entry.mood}</span>
                        )}
                      </div>
                    </div>
                    {entry.summary && (
                      <p className={`${mutedTextClasses} text-sm`}>
                        {entry.summary}
                      </p>
                    )}
                    <div className="space-y-2">
                      <p className={`${mutedTextClasses} text-xs uppercase tracking-wide`}>
                        Linked mentors
                      </p>
                      {mentorList.length ? (
                        <ul className="flex flex-wrap gap-2">
                          {mentorList.map((mentor) => (
                            <li key={mentor.id} className="flex items-center gap-2">
                              <span className={chipBaseClasses}>
                                {mentor.name || mentor.email || `Mentor ${mentor.id}`}
                              </span>
                              <button
                                type="button"
                                className={`${subtleButtonClasses} px-3 py-1 text-xs`}
                                onClick={() => {
                                  const params = new URLSearchParams();
                                  params.set("link", "linked");

                                  if (mentor?.id) {
                                    params.set("mentorId", String(mentor.id));
                                  }

                                  const mentorQuery =
                                    mentor.email || mentor.name || "";
                                  if (mentorQuery) {
                                    params.set(
                                      "q",
                                      mentorQuery.toLowerCase()
                                    );
                                  }

                                  navigate(`/mentorship?${params.toString()}`);
                                }}
                              >
                                View mentor
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`${mutedTextClasses} text-sm`}>
                          No mentors linked.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <button
                      type="button"
                      className={`${secondaryButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                      onClick={() => {
                        const journalerQuery = (
                          entry.journaler?.email || entry.journaler?.name || ""
                        )
                          .toLowerCase()
                          .trim();
                        const queryString = journalerQuery
                          ? `?q=${encodeURIComponent(journalerQuery)}`
                          : "";
                        navigate(`/journalers${queryString}`);
                      }}
                    >
                      View journaler
                    </button>
                    <button
                      type="button"
                      className={`${dangerButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                      onClick={() => handleDeleteEntry(entry)}
                    >
                      Delete journal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={emptyStateClasses}>No journal entries match those filters.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default JournalAdminPage;
