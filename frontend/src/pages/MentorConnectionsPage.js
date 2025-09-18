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
  chipBaseClasses,
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
    isEnabled: notificationsEnabled,
  } = useNotifications();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
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
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user.role]);

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

  const handleNotificationRead = async (notificationId) => {
    if (!notificationsEnabled) {
      return;
    }

    await markAsRead(notificationId);
  };

  if (loading) {
    return <LoadingState label="Loading mentorship" />;
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
