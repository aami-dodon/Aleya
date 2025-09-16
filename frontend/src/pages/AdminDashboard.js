import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import MetricCard from "../components/MetricCard";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

function AdminDashboard() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [forms, setForms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [overviewRes, formsRes, mentorsRes] = await Promise.all([
          apiClient.get("/admin/overview", token),
          apiClient.get("/admin/forms", token),
          apiClient.get("/admin/mentors", token),
        ]);
        if (!isMounted) return;
        setOverview(overviewRes);
        setForms(formsRes.forms || []);
        setMentors(mentorsRes.mentors || []);
        setError(null);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading && !overview) {
    return <LoadingState label="Loading admin overview" />;
  }

  return (
    <div className="dashboard-page">
      <SectionCard
        title="Platform health"
        subtitle="Watch the forest grow while keeping it safe"
      >
        {error && <p className="form-error">{error}</p>}
        {overview ? (
          <div className="metrics-grid">
            <MetricCard
              title="Journalers"
              value={overview.users?.journalers || 0}
              description="Active people tending to their reflections"
            />
            <MetricCard
              title="Mentors"
              value={overview.users?.mentors || 0}
              description="Guides offering encouragement"
            />
            <MetricCard
              title="Forms in library"
              value={overview.forms?.total || 0}
              description={`${overview.forms?.defaults || 0} default templates available`}
            />
            <MetricCard
              title="Entries logged"
              value={overview.entries?.total || 0}
              description="Reflections stored securely"
            />
          </div>
        ) : (
          <p className="empty-state">No data available yet.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Form library"
        subtitle="Manage prompts that journalers and mentors can use"
      >
        {forms.length ? (
          <div className="table">
            <div className="table-header">
              <span>Title</span>
              <span>Visibility</span>
              <span>Assignments</span>
            </div>
            {forms.map((form) => (
              <div className="table-row" key={form.id}>
                <span>{form.title}</span>
                <span className={`chip chip-${form.visibility}`}>{form.visibility}</span>
                <span>{form.assignments}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No forms yet. Create prompts to empower mentors.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Mentor directory"
        subtitle="Support and onboard guides who hold space for journalers"
      >
        {mentors.length ? (
          <ul className="mentor-list">
            {mentors.map((mentor) => (
              <li key={mentor.id}>
                <div>
                  <strong>{mentor.name}</strong>
                  <p>{mentor.expertise || "Expertise not provided"}</p>
                </div>
                <span className="chip">{mentor.mentee_count} mentees</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No mentors onboarded yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default AdminDashboard;
