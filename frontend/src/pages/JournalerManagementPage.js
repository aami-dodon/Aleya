import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  captionTextClasses,
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

function JournalerManagementPage() {
  const { token } = useAuth();
  const [journalers, setJournalers] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsString = searchParams.toString();
  const navigate = useNavigate();
  const [journalerSearch, setJournalerSearch] = useState(
    () => searchParams.get("q") || ""
  );
  const [journalerQuery, setJournalerQuery] = useState(
    () => searchParams.get("q") || ""
  );
  const [mentorFilter, setMentorFilter] = useState(
    () => searchParams.get("mentorId") || ""
  );
  const [linkFilter, setLinkFilter] = useState(() => {
    const param = searchParams.get("link");
    return param === "linked" || param === "unlinked" ? param : "all";
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    if (nextQuery !== journalerQuery) {
      setJournalerQuery(nextQuery);
    }

    if (nextQuery !== journalerSearch) {
      setJournalerSearch(nextQuery);
    }

    const nextLink = searchParams.get("link");
    const normalizedLink =
      nextLink === "linked" || nextLink === "unlinked" ? nextLink : "all";

    if (normalizedLink !== linkFilter) {
      setLinkFilter(normalizedLink);
    }

    const nextMentor = searchParams.get("mentorId") || "";
    if (nextMentor !== mentorFilter) {
      setMentorFilter(nextMentor);
    }
  }, [
    journalerQuery,
    journalerSearch,
    linkFilter,
    mentorFilter,
    paramsString,
    searchParams,
  ]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isActive = true;
    const loadJournalers = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/admin/journalers${
            journalerQuery ? `?q=${encodeURIComponent(journalerQuery)}` : ""
          }`,
          token
        );

        if (!isActive) {
          return;
        }

        setJournalers(res.journalers || []);
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

    loadJournalers();

    return () => {
      isActive = false;
    };
  }, [journalerQuery, reloadKey, token]);

  const handleJournalerSearch = (event) => {
    event.preventDefault();
    const normalized = journalerSearch.trim().toLowerCase();
    const nextParams = new URLSearchParams();

    if (normalized) {
      nextParams.set("q", normalized);
    }

    if (linkFilter !== "all") {
      nextParams.set("link", linkFilter);
    }

    if (mentorFilter) {
      nextParams.set("mentorId", mentorFilter);
    }

    setSearchParams(nextParams);
  };

  const handleLinkFilterChange = (value) => {
    const normalized = value === "linked" || value === "unlinked" ? value : "all";
    setLinkFilter(normalized);

    const nextParams = new URLSearchParams();

    if (journalerQuery) {
      nextParams.set("q", journalerQuery);
    }

    if (normalized !== "all") {
      nextParams.set("link", normalized);
    }

    if (mentorFilter) {
      nextParams.set("mentorId", mentorFilter);
    }

    setSearchParams(nextParams);
  };

  const handleMentorFilterChange = (value) => {
    const normalized = value || "";
    setMentorFilter(normalized);

    const nextParams = new URLSearchParams();

    if (journalerQuery) {
      nextParams.set("q", journalerQuery);
    }

    if (linkFilter !== "all") {
      nextParams.set("link", linkFilter);
    }

    if (normalized) {
      nextParams.set("mentorId", normalized);
    }

    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setJournalerSearch("");
    setJournalerQuery("");
    setLinkFilter("all");
    setMentorFilter("");
    if (paramsString) {
      setSearchParams({});
    }
  };

  const unlinkMentor = async (mentorId, journaler) => {
    try {
      await apiClient.del(`/admin/mentor-links/${mentorId}/${journaler.id}`, token);
      setMessage(`Unlinked ${journaler.name || journaler.email}.`);
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteJournaler = async (journaler) => {
    const confirmed = window.confirm(
      `Remove ${journaler.name}? This will delete their reflections, assignments, and mentor links.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.del(`/admin/journalers/${journaler.id}`, token);
      setMessage(`${journaler.name} has been removed.`);
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const mentorOptions = useMemo(() => {
    const map = new Map();

    journalers.forEach((journaler) => {
      if (!Array.isArray(journaler.mentors)) {
        return;
      }

      journaler.mentors.forEach((mentor) => {
        if (!mentor?.id) {
          return;
        }

        const key = String(mentor.id);
        if (!map.has(key)) {
          map.set(key, mentor.name || mentor.email || `Mentor ${key}`);
        }
      });
    });

    if (mentorFilter && !map.has(mentorFilter)) {
      map.set(mentorFilter, `Mentor ${mentorFilter}`);
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [journalers, mentorFilter]);

  const filteredJournalers = useMemo(() => {
    return journalers.filter((journaler) => {
      const mentorCount = Number.parseInt(journaler.mentor_count, 10) || 0;
      const mentorsList = Array.isArray(journaler.mentors)
        ? journaler.mentors
        : [];

      if (mentorFilter) {
        const hasMentor = mentorsList.some(
          (mentor) => String(mentor?.id) === mentorFilter
        );

        if (!hasMentor) {
          return false;
        }
      }

      if (linkFilter === "linked") {
        return mentorCount > 0;
      }

      if (linkFilter === "unlinked") {
        return mentorCount === 0;
      }

      return true;
    });
  }, [journalers, linkFilter, mentorFilter]);

  const filtersApplied =
    (journalerQuery || "").trim().length > 0 ||
    linkFilter !== "all" ||
    Boolean(mentorFilter);

  if (loading) {
    return <LoadingState label="Loading journalers" />;
  }

  const tableGrid = "minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(0, 0.8fr)";

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      {message && <p className={infoTextClasses}>{message}</p>}
      <SectionCard
        title="Journaler management"
        subtitle="Shepherd every journaler's journey, review their mentor ties, and gently close accounts that need to rest"
        action={
          <form className="flex flex-wrap items-center gap-3" onSubmit={handleJournalerSearch}>
            <label className="sr-only" htmlFor="journaler-search">
              Search journalers
            </label>
            <input
              id="journaler-search"
              type="search"
              placeholder="Search by name or email"
              value={journalerSearch}
              onChange={(event) => setJournalerSearch(event.target.value)}
              className={`${inputCompactClasses} w-full sm:w-64`}
            />
            <label className="sr-only" htmlFor="journaler-link-filter">
              Filter by mentor connections
            </label>
            <select
              id="journaler-link-filter"
              className={`${selectCompactClasses} w-full sm:w-48`}
              value={linkFilter}
              onChange={(event) => handleLinkFilterChange(event.target.value)}
            >
              <option value="all">All journalers</option>
              <option value="linked">Linked to mentors</option>
              <option value="unlinked">Waiting for mentors</option>
            </select>
            <label className="sr-only" htmlFor="journaler-mentor-filter">
              Focus on mentor
            </label>
            <select
              id="journaler-mentor-filter"
              className={`${selectCompactClasses} w-full sm:w-48`}
              value={mentorFilter}
              onChange={(event) => handleMentorFilterChange(event.target.value)}
            >
              <option value="">All mentors</option>
              {mentorOptions.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.label}
                </option>
              ))}
            </select>
            <button type="submit" className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}>
              Apply search
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
        {filteredJournalers.length ? (
          <div className="space-y-3">
            <div
              className={`${tableHeaderClasses} md:px-4`}
              style={{ "--table-grid": tableGrid }}
            >
              <span>Journaler</span>
              <span>Mentor connections</span>
              <span className="md:text-right">Actions</span>
            </div>
            {filteredJournalers.map((journaler) => {
              const mentorList = Array.isArray(journaler.mentors)
                ? journaler.mentors.filter((mentor) => mentor && mentor.id)
                : [];
              const mentorCount = Number.parseInt(journaler.mentor_count, 10) || 0;

              return (
                <div
                  key={journaler.id}
                  className={tableRowClasses}
                  style={{ "--table-grid": tableGrid }}
                >
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-emerald-900">
                      {journaler.name || journaler.email}
                    </p>
                    {journaler.email && (
                      <p className={infoTextClasses}>{journaler.email}</p>
                    )}
                    <p className={`${mutedTextClasses} text-sm`}>
                      {mentorCount} mentor{mentorCount === 1 ? "" : "s"} linked
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className={`${mutedTextClasses} text-xs uppercase tracking-wide`}>
                      Linked mentors
                    </p>
                    {mentorList.length ? (
                      <ul className="space-y-2">
                        {mentorList.map((mentor) => (
                          <li
                            key={mentor.id}
                            className="flex flex-col gap-2 rounded-xl bg-white/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-emerald-900">
                                {mentor.name || "Mentor"}
                              </p>
                              {mentor.email && (
                                <p className={`${captionTextClasses} text-emerald-900/70`}>
                                  {mentor.email}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              className={`${subtleButtonClasses} px-3 py-1 text-xs`}
                              onClick={() =>
                                unlinkMentor(mentor.id, {
                                  id: journaler.id,
                                  name: journaler.name,
                                  email: journaler.email,
                                })
                              }
                            >
                              Unlink mentor
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`${mutedTextClasses} text-sm`}>
                        Not yet connected to a mentor.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <button
                      type="button"
                      className={`${secondaryButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                      onClick={() => navigate(`/journals?journalerId=${journaler.id}`)}
                    >
                      View journals
                    </button>
                    <button
                      type="button"
                      className={`${dangerButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                      onClick={() => deleteJournaler(journaler)}
                    >
                      Delete journaler
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={emptyStateClasses}>No journalers match those filters.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default JournalerManagementPage;

