import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import MentorRequestList from "../components/MentorRequestList";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

function MentorConnectionsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const requestsRes = await apiClient.get("/mentors/requests", token);
      setRequests(requestsRes.requests || []);

      if (user.role === "mentor") {
        const menteesRes = await apiClient.get("/mentors/mentees", token);
        setMentees(menteesRes.mentees || []);
      } else {
        const mentorsRes = await apiClient.get("/mentors", token);
        setMentors(mentorsRes.mentors || []);
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

  const handleSearch = async (event) => {
    event.preventDefault();
    const res = await apiClient.get(`/mentors?q=${encodeURIComponent(search)}`, token);
    setMentors(res.mentors || []);
  };

  const sendRequest = async (mentor) => {
    await apiClient.post(
      "/mentors/requests",
      { mentorId: mentor.id },
      token
    );
    setMessage(`Request sent to ${mentor.name}.`);
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

  if (loading) {
    return <LoadingState label="Loading mentorship" />;
  }

  return (
    <div className="dashboard-page">
      {message && <p className="info-text">{message}</p>}

      {user.role === "journaler" && (
        <SectionCard
          title="Find a mentor"
          subtitle="Invite someone who can check in on your reflections"
          action={
            <form className="inline-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search by name or expertise"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" className="ghost-button">
                Search
              </button>
            </form>
          }
        >
          {mentors.length ? (
            <ul className="mentor-list">
              {mentors.map((mentor) => (
                <li key={mentor.id}>
                  <div>
                    <strong>{mentor.name}</strong>
                    <p>{mentor.expertise || "Mentor"}</p>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => sendRequest(mentor)}
                  >
                    Request mentorship
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No mentors match that search yet.</p>
          )}
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
        />
      </SectionCard>

      {user.role === "mentor" && (
        <SectionCard
          title="Linked mentees"
          subtitle="Celebrate consistency and see who might need encouragement"
        >
          {mentees.length ? (
            <ul className="mentor-list">
              {mentees.map((mentee) => (
                <li key={mentee.id}>
                  <div>
                    <strong>{mentee.name}</strong>
                    <p>{mentee.email}</p>
                  </div>
                  {mentee.latestEntry ? (
                    <span className="chip">
                      Last entry {mentee.latestEntry.mood || "—"} · {mentee.latestEntry.sharedLevel}
                    </span>
                  ) : (
                    <span className="chip">No entries yet</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No mentees linked yet.</p>
          )}
        </SectionCard>
      )}
    </div>
  );
}

export default MentorConnectionsPage;
