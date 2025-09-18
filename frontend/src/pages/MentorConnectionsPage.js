import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import MentorRequestList from "../components/MentorRequestList";
import MentorProfileDialog from "../components/MentorProfileDialog";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  captionTextClasses,
  chipBaseClasses,
  dangerButtonClasses,
  emptyStateClasses,
  infoTextClasses,
  inputCompactClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  selectCompactClasses,
  subtleButtonClasses,
  mutedTextClasses,
  tableHeaderClasses,
  tableRowClasses,
} from "../styles/ui";
import { parseExpertise } from "../utils/expertise";

const ACTIVE_MENTOR_STATUSES = new Set(["pending", "mentor_accepted", "confirmed"]);

function MentorConnectionsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsString = searchParams.toString();
  const [requests, setRequests] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [mentorQuery, setMentorQuery] = useState(
    () => searchParams.get("q") || ""
  );
  const [mentorIdFilter, setMentorIdFilter] = useState(
    () => searchParams.get("mentorId") || ""
  );
  const [linkFilter, setLinkFilter] = useState(() => {
    const param = searchParams.get("link");
    return param === "linked" || param === "unlinked" ? param : "all";
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [linkEmails, setLinkEmails] = useState({});
  const [linkErrors, setLinkErrors] = useState({});
  const isAdmin = user.role === "admin";

  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    if (nextQuery !== mentorQuery) {
      setMentorQuery(nextQuery);
    }

    if (nextQuery !== search) {
      setSearch(nextQuery);
    }

    const nextLink = searchParams.get("link");
    const normalizedLink =
      nextLink === "linked" || nextLink === "unlinked" ? nextLink : "all";

    if (normalizedLink !== linkFilter) {
      setLinkFilter(normalizedLink);
    }

    const nextMentorId = searchParams.get("mentorId") || "";
    if (nextMentorId !== mentorIdFilter) {
      setMentorIdFilter(nextMentorId);
    }
  }, [
    linkFilter,
    mentorIdFilter,
    mentorQuery,
    paramsString,
    search,
    searchParams,
  ]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const mentorsRes = await apiClient.get("/admin/mentors", token);
        setMentors(mentorsRes.mentors || []);
        setRequests([]);
        setMentees([]);
        setMessage(null);
      } else {
        const requestsRes = await apiClient.get("/mentors/requests", token);
        const pendingRequests = requestsRes.requests || [];
        setRequests(pendingRequests);

        if (user.role === "mentor") {
          const menteesRes = await apiClient.get("/mentors/mentees", token);
          setMentees(menteesRes.mentees || []);
        } else {
          const hasActiveMentor = pendingRequests.some((request) =>
            ACTIVE_MENTOR_STATUSES.has(request.status)
          );

          if (hasActiveMentor) {
            setMentors([]);
          } else {
            const mentorsRes = await apiClient.get("/mentors", token);
            setMentors(mentorsRes.mentors || []);
          }
        }

        setMessage(null);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  const activeMentorRequest =
    user.role === "journaler"
      ? requests.find((request) => ACTIVE_MENTOR_STATUSES.has(request.status))
      : null;
  const canRequestMentor = user.role !== "journaler" || !activeMentorRequest;

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!canRequestMentor) {
      return;
    }
    const res = await apiClient.get(`/mentors?q=${encodeURIComponent(search)}`, token);
    setMentors(res.mentors || []);
  };

  const handleAdminSearch = (event) => {
    event.preventDefault();
    const normalized = search.trim().toLowerCase();
    const nextParams = new URLSearchParams();

    if (normalized) {
      nextParams.set("q", normalized);
    }

    if (linkFilter !== "all") {
      nextParams.set("link", linkFilter);
    }

    if (mentorIdFilter) {
      nextParams.set("mentorId", mentorIdFilter);
    }

    setSearchParams(nextParams);
  };

  const handleAdminLinkFilterChange = (value) => {
    const normalized = value === "linked" || value === "unlinked" ? value : "all";
    setLinkFilter(normalized);

    const nextParams = new URLSearchParams();

    if (mentorQuery) {
      nextParams.set("q", mentorQuery);
    }

    if (normalized !== "all") {
      nextParams.set("link", normalized);
    }

    if (mentorIdFilter) {
      nextParams.set("mentorId", mentorIdFilter);
    }

    setSearchParams(nextParams);
  };

  const handleMentorFocusChange = (value) => {
    const normalized = value || "";
    setMentorIdFilter(normalized);

    const nextParams = new URLSearchParams();

    if (mentorQuery) {
      nextParams.set("q", mentorQuery);
    }

    if (linkFilter !== "all") {
      nextParams.set("link", linkFilter);
    }

    if (normalized) {
      nextParams.set("mentorId", normalized);
    }

    setSearchParams(nextParams);
  };

  const handleClearAdminFilters = () => {
    setSearch("");
    setMentorQuery("");
    setLinkFilter("all");
    setMentorIdFilter("");
    if (paramsString) {
      setSearchParams({});
    }
  };

  const sendRequest = async (mentor) => {
    if (!canRequestMentor) {
      setMessage("You already have an active mentor connection.");
      return;
    }
    await apiClient.post(
      "/mentors/requests",
      { mentorId: mentor.id },
      token
    );
    setMessage(`Request sent to ${mentor.name}.`);
    setSelectedMentor(null);
    load();
  };

  const acceptRequest = async (request) => {
    await apiClient.post(`/mentors/requests/${request.id}/accept`, null, token);
    load();
  };

  const confirmRequest = async (request) => {
    await apiClient.post(`/mentors/requests/${request.id}/confirm`, null, token);
    load();
  };

  const declineRequest = async (request) => {
    await apiClient.post(`/mentors/requests/${request.id}/decline`, null, token);
    load();
  };

  const endMentorship = async (request) => {
    await apiClient.del(`/mentors/links/${request.mentor.id}`, token);
    await load();
    setMessage(`You ended your mentorship with ${request.mentor.name}.`);
  };

  const handleLinkEmailChange = (mentorId, value) => {
    setLinkEmails((prev) => ({ ...prev, [mentorId]: value }));
    setLinkErrors((prev) => ({ ...prev, [mentorId]: null }));
  };

  const linkMentee = async (mentor) => {
    const email = (linkEmails[mentor.id] || "").trim();

    if (!email) {
      setLinkErrors((prev) => ({ ...prev, [mentor.id]: "Enter an email to link." }));
      setMessage(null);
      return;
    }

    try {
      await apiClient.post(
        "/admin/mentor-links",
        { mentorId: mentor.id, journalerEmail: email },
        token
      );
      setMessage(`Linked ${email} with ${mentor.name}.`);
      setLinkEmails((prev) => ({ ...prev, [mentor.id]: "" }));
      await load();
    } catch (error) {
      setMessage(null);
      setLinkErrors((prev) => ({ ...prev, [mentor.id]: error.message }));
    }
  };

  const unlinkMentee = async (mentorId, mentee) => {
    try {
      await apiClient.del(`/admin/mentor-links/${mentorId}/${mentee.id}`, token);
      setMessage(`Unlinked ${mentee.name || mentee.email}.`);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteMentor = async (mentor) => {
    const confirmed = window.confirm(
      `Remove ${mentor.name}? This will delete their mentor account and links.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await apiClient.del(`/admin/mentors/${mentor.id}`, token);
      setMessage(`${mentor.name} has been removed.`);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const mentorOptions = useMemo(() => {
    const map = new Map();

    mentors.forEach((mentor) => {
      if (!mentor?.id) {
        return;
      }

      const key = String(mentor.id);
      if (!map.has(key)) {
        map.set(key, mentor.name || mentor.email || `Mentor ${key}`);
      }
    });

    if (mentorIdFilter && !map.has(mentorIdFilter)) {
      map.set(mentorIdFilter, `Mentor ${mentorIdFilter}`);
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [mentorIdFilter, mentors]);

  const filteredMentors = useMemo(() => {
    if (!isAdmin) {
      return mentors;
    }

    const normalizedQuery = mentorQuery.trim().toLowerCase();

    return mentors.filter((mentor) => {
      const menteeCount = Number.parseInt(mentor.mentee_count, 10) || 0;

      if (mentorIdFilter && String(mentor.id) !== mentorIdFilter) {
        return false;
      }

      if (linkFilter === "linked" && menteeCount === 0) {
        return false;
      }

      if (linkFilter === "unlinked" && menteeCount > 0) {
        return false;
      }

      if (normalizedQuery) {
        const haystack = [
          mentor.name,
          mentor.email,
          mentor.bio,
          mentor.availability,
          mentor.expertise,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [isAdmin, linkFilter, mentorIdFilter, mentorQuery, mentors]);

  const adminFiltersApplied =
    (mentorQuery || "").trim().length > 0 ||
    linkFilter !== "all" ||
    Boolean(mentorIdFilter);

  if (loading) {
    return <LoadingState label="Loading mentorship" />;
  }

  if (isAdmin) {
    const tableGrid = "minmax(0, 1.8fr) minmax(0, 1.6fr) minmax(0, 1fr)";

    return (
      <div className="flex w-full flex-1 flex-col gap-8">
        {message && <p className={infoTextClasses}>{message}</p>}
        <SectionCard
          title="Mentor management"
          subtitle="Curate guides, connect them with journalers, and prune links that no longer serve"
          action={
            <form className="flex flex-wrap items-center gap-3" onSubmit={handleAdminSearch}>
              <label className="sr-only" htmlFor="mentor-search">
                Search mentors
              </label>
              <input
                id="mentor-search"
                type="search"
                placeholder="Search by name, email, or expertise"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${inputCompactClasses} w-full sm:w-64`}
              />
              <label className="sr-only" htmlFor="mentor-link-filter">
                Filter by link status
              </label>
              <select
                id="mentor-link-filter"
                className={`${selectCompactClasses} w-full sm:w-48`}
                value={linkFilter}
                onChange={(event) =>
                  handleAdminLinkFilterChange(event.target.value)
                }
              >
                <option value="all">All mentors</option>
                <option value="linked">Mentors with journalers</option>
                <option value="unlinked">Awaiting journalers</option>
              </select>
              <label className="sr-only" htmlFor="mentor-focus-filter">
                Focus on a mentor
              </label>
              <select
                id="mentor-focus-filter"
                className={`${selectCompactClasses} w-full sm:w-48`}
                value={mentorIdFilter}
                onChange={(event) => handleMentorFocusChange(event.target.value)}
              >
                <option value="">All mentors</option>
                {mentorOptions.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
              >
                Apply search
              </button>
              <button
                type="button"
                className={`${subtleButtonClasses} px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60`}
                onClick={handleClearAdminFilters}
                disabled={!adminFiltersApplied}
              >
                Clear filters
              </button>
            </form>
          }
        >
          {filteredMentors.length ? (
            <div className="space-y-3">
              <div
                className={`${tableHeaderClasses} md:px-4`}
                style={{ "--table-grid": tableGrid }}
              >
                <span>Mentor</span>
                <span>Journaler links</span>
                <span className="md:text-right">Actions</span>
              </div>
              {filteredMentors.map((mentor) => {
                const expertiseTags = parseExpertise(mentor.expertise);
                const menteeList = Array.isArray(mentor.mentees)
                  ? mentor.mentees
                  : [];
                return (
                  <div
                    key={mentor.id}
                    className={tableRowClasses}
                    style={{ "--table-grid": tableGrid }}
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-emerald-900">
                          {mentor.name}
                        </p>
                        <p className={infoTextClasses}>{mentor.email}</p>
                      </div>
                      {expertiseTags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {expertiseTags.map((tag) => (
                            <span key={tag} className={chipBaseClasses}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className={`${mutedTextClasses} text-sm`}>
                          Expertise not provided
                        </p>
                      )}
                      {mentor.bio && (
                        <p className={`${mutedTextClasses} text-sm`}>
                          {mentor.bio}
                        </p>
                      )}
                      {mentor.availability && (
                        <p className={`${mutedTextClasses} text-sm`}>
                          Availability: {mentor.availability}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                        <p className={`${infoTextClasses} font-semibold text-emerald-900`}>
                          Linked journalers
                        </p>
                        {menteeList.length ? (
                          <ul className="space-y-2">
                            {menteeList.map((mentee) => (
                              <li
                                key={mentee.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-emerald-900">
                                    {mentee.name}
                                  </p>
                                  <p className={`${captionTextClasses} text-emerald-900/70`}>
                                    {mentee.email}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className={`${subtleButtonClasses} px-3 py-1 text-xs`}
                                  onClick={() => unlinkMentee(mentor.id, mentee)}
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className={`${mutedTextClasses} text-sm`}>
                            No journalers linked yet.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className={`${captionTextClasses} text-emerald-900/70`}>
                          Link a journaler by email
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="email"
                            value={linkEmails[mentor.id] || ""}
                            onChange={(event) =>
                              handleLinkEmailChange(mentor.id, event.target.value)
                            }
                            placeholder="journaler@example.com"
                            className={`${inputCompactClasses} flex-1`}
                          />
                          <button
                            type="button"
                            className={`${primaryButtonClasses} px-5 py-2.5 text-sm`}
                            onClick={() => linkMentee(mentor)}
                          >
                            Link journaler
                          </button>
                        </div>
                        {linkErrors[mentor.id] && (
                          <p className="text-sm font-semibold text-rose-600">
                            {linkErrors[mentor.id]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <button
                        type="button"
                        className={`${secondaryButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set("creatorId", String(mentor.id));

                          const creatorLabel = mentor.name || mentor.email;
                          if (creatorLabel) {
                            params.set("creator", creatorLabel);
                          }

                          navigate(`/forms?${params.toString()}`);
                        }}
                      >
                        View forms
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                        onClick={() =>
                          navigate(
                            `/journalers?mentorId=${mentor.id}&link=linked`
                          )
                        }
                      >
                        View journalers
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                        onClick={() =>
                          navigate(`/journals?mentorId=${mentor.id}`)
                        }
                      >
                        View journals
                      </button>
                      <button
                        type="button"
                        className={`${dangerButtonClasses} w-full px-4 py-2 text-sm md:w-auto`}
                        onClick={() => deleteMentor(mentor)}
                      >
                        Delete mentor
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={emptyStateClasses}>No mentors onboarded yet.</p>
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      {message && <p className={infoTextClasses}>{message}</p>}

      {user.role === "journaler" && (
        <>
          {canRequestMentor ? (
            <SectionCard
              title="Find a mentor"
              subtitle="Invite someone who can check in on your reflections"
              action={
                <form
                  className="flex flex-wrap items-center gap-3"
                  onSubmit={handleSearch}
                >
                  <input
                    type="text"
                    placeholder="Search by name or expertise"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={`${inputCompactClasses} w-full sm:w-72`}
                  />
                  <button
                    type="submit"
                    className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
                  >
                    Search
                  </button>
                </form>
              }
            >
              {mentors.length ? (
                <ul className="grid gap-4">
                  {mentors.map((mentor) => {
                    const expertiseTags = parseExpertise(mentor.expertise);
                    return (
                      <li
                        key={mentor.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-5"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedMentor(mentor)}
                          className="group flex-1 space-y-1 text-left"
                        >
                          <p className="text-base font-semibold text-emerald-900 group-hover:text-emerald-700">
                            {mentor.name}
                          </p>
                          {expertiseTags.length ? (
                            <div className="flex flex-wrap gap-2">
                              {expertiseTags.map((tag) => (
                                <span key={tag} className={chipBaseClasses}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className={infoTextClasses}>Mentor</p>
                          )}
                        </button>
                        <button
                          type="button"
                          className={`${primaryButtonClasses} px-5 py-2.5 text-sm`}
                          onClick={() => sendRequest(mentor)}
                        >
                          Request mentorship
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={emptyStateClasses}>No mentors match that search yet.</p>
              )}
            </SectionCard>
          ) : (
            <SectionCard
              title="You're linked with a mentor"
              subtitle="Your current mentorship needs to close before inviting someone new"
            >
              <p className={infoTextClasses}>
                {activeMentorRequest?.mentor?.name
                  ? `You're connected with ${activeMentorRequest.mentor.name}.`
                  : "You already have an active mentor request."}
                {activeMentorRequest?.status === "pending" &&
                  " They are still reviewing your invitation."}
                {activeMentorRequest?.status === "mentor_accepted" &&
                  " Confirm the link below or decline to choose someone else."}
                {activeMentorRequest?.status === "confirmed" &&
                  " You can manage the connection from the requests list below."}
              </p>
            </SectionCard>
          )}
        </>
      )}

      <SectionCard
        title="Mentorship requests"
        subtitle="Track invitations and links"
      >
        <MentorRequestList
          requests={requests}
          role={user.role}
          onAccept={acceptRequest}
          onConfirm={confirmRequest}
          onDecline={declineRequest}
          onEnd={endMentorship}
        />
      </SectionCard>

      {user.role === "mentor" && (
        <SectionCard
          title="Linked mentees"
          subtitle="Celebrate consistency and see who might need encouragement"
        >
          {mentees.length ? (
            <ul className="grid gap-4">
              {mentees.map((mentee) => (
                <li
                  key={mentee.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-5"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-emerald-900">
                      {mentee.name}
                    </p>
                    <p className={infoTextClasses}>{mentee.email}</p>
                  </div>
                  {mentee.latestEntry ? (
                    <span className={chipBaseClasses}>
                      Last entry {mentee.latestEntry.mood || "—"} · {mentee.latestEntry.sharedLevel}
                    </span>
                  ) : (
                    <span className={chipBaseClasses}>No entries yet</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={emptyStateClasses}>No mentees linked yet.</p>
          )}
        </SectionCard>
      )}
      <MentorProfileDialog
        mentor={selectedMentor}
        onClose={() => setSelectedMentor(null)}
        onRequest={sendRequest}
        canRequest={canRequestMentor}
      />
    </div>
  );
}

export default MentorConnectionsPage;
