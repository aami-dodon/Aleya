import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import MentorRequestList from "../components/MentorRequestList";
import MentorProfileDialog from "../components/MentorProfileDialog";
import NotificationList from "../components/NotificationList";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import {
  captionTextClasses,
  chipBaseClasses,
  dangerButtonClasses,
  emptyStateClasses,
  infoTextClasses,
  inputCompactClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "../styles/ui";
import { parseExpertise } from "../utils/expertise";

const ACTIVE_MENTOR_STATUSES = new Set(["pending", "mentor_accepted", "confirmed"]);

function MentorConnectionsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [journalers, setJournalers] = useState([]);
  const [search, setSearch] = useState("");
  const [journalerSearch, setJournalerSearch] = useState("");
  const [journalerQuery, setJournalerQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [linkEmails, setLinkEmails] = useState({});
  const [linkErrors, setLinkErrors] = useState({});
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    isEnabled: notificationsEnabled,
  } = useNotifications();
  const isAdmin = user.role === "admin";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const [mentorsRes, journalersRes] = await Promise.all([
          apiClient.get("/admin/mentors", token),
          apiClient.get(
            `/admin/journalers${
              journalerQuery ? `?q=${encodeURIComponent(journalerQuery)}` : ""
            }`,
            token
          ),
        ]);
        setMentors(mentorsRes.mentors || []);
        setJournalers(journalersRes.journalers || []);
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
        setJournalers([]);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, journalerQuery, token, user.role]);

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

  const handleJournalerSearch = async (event) => {
    event.preventDefault();
    setJournalerQuery(journalerSearch.trim().toLowerCase());
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
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleNotificationRead = async (notificationId) => {
    if (!notificationsEnabled) {
      return;
    }

    await markAsRead(notificationId);
  };

  if (loading) {
    return <LoadingState label="Loading mentorship" />;
  }

  if (isAdmin) {
    return (
      <div className="flex w-full flex-1 flex-col gap-8">
        {message && <p className={infoTextClasses}>{message}</p>}
        <SectionCard
          title="Journaler management"
          subtitle="Shepherd every journaler's journey, review their mentor ties, and gently close accounts that need to rest"
          action={
            <form
              className="flex flex-wrap items-center gap-3"
              onSubmit={handleJournalerSearch}
            >
              <input
                type="search"
                placeholder="Search by name or email"
                value={journalerSearch}
                onChange={(event) => setJournalerSearch(event.target.value)}
                className={`${inputCompactClasses} w-full sm:w-72`}
              />
              <button
                type="submit"
                className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
              >
                Search journalers
              </button>
            </form>
          }
        >
          {journalers.length ? (
            <ul className="space-y-6">
              {journalers.map((journaler) => {
                const mentorList = Array.isArray(journaler.mentors)
                  ? journaler.mentors
                  : [];

                return (
                  <li
                    key={journaler.id}
                    className="rounded-2xl border border-emerald-100 bg-white/70 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-emerald-900">
                          {journaler.name}
                        </p>
                        <p className={infoTextClasses}>{journaler.email}</p>
                      </div>
                      <div className="flex flex-col gap-3 lg:w-1/2">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <p className={`${infoTextClasses} mb-3 font-semibold text-emerald-900`}>
                            Linked mentors
                          </p>
                          {mentorList.length ? (
                            <ul className="space-y-2">
                              {mentorList.map((mentor) => (
                                <li
                                  key={mentor.id}
                                  className="flex flex-col gap-2 rounded-lg bg-white/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-emerald-900">
                                      {mentor.name || "Mentor"}
                                    </p>
                                    <p className={`${captionTextClasses} text-emerald-900/70`}>
                                      {mentor.email}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className={`${secondaryButtonClasses} px-3 py-1 text-xs`}
                                    onClick={() =>
                                      unlinkMentee(mentor.id, {
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
                            <p className={infoTextClasses}>
                              Not yet connected to a mentor.
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`${dangerButtonClasses} self-start px-4 py-2 text-sm`}
                          onClick={() => deleteJournaler(journaler)}
                        >
                          Delete journaler
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={emptyStateClasses}>No journalers found.</p>
          )}
        </SectionCard>
        <SectionCard
          title="Mentor management"
          subtitle="Curate guides, connect them with journalers, and prune links that no longer serve"
        >
          {mentors.length ? (
            <ul className="space-y-6">
              {mentors.map((mentor) => {
                const expertiseTags = parseExpertise(mentor.expertise);
                const menteeList = Array.isArray(mentor.mentees)
                  ? mentor.mentees
                  : [];
                return (
                  <li
                    key={mentor.id}
                    className="rounded-2xl border border-emerald-100 bg-white/70 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
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
                          <p className={infoTextClasses}>Expertise not provided</p>
                        )}
                        {mentor.bio && (
                          <p className="text-sm text-emerald-900/70">{mentor.bio}</p>
                        )}
                        {mentor.availability && (
                          <p className={infoTextClasses}>
                            Availability: {mentor.availability}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 lg:w-1/2">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                          <p className={`${infoTextClasses} mb-3 font-semibold text-emerald-900`}>
                            Linked mentees
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
                                    className={`${secondaryButtonClasses} px-3 py-1 text-xs`}
                                    onClick={() => unlinkMentee(mentor.id, mentee)}
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className={infoTextClasses}>No mentees linked yet.</p>
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
                        <button
                          type="button"
                          className={`${dangerButtonClasses} self-start px-4 py-2 text-sm`}
                          onClick={() => deleteMentor(mentor)}
                        >
                          Delete mentor
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
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

      {user.role === "mentor" && notificationsEnabled && (
        <SectionCard
          title="Mentor notifications"
          subtitle="Recent reflections shared by your mentees"
        >
          <NotificationList
            notifications={notifications}
            loading={notificationsLoading}
            onMarkRead={handleNotificationRead}
          />
        </SectionCard>
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
