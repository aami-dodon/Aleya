import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingState from "../components/LoadingState";
import MetricCard from "../components/MetricCard";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  chipBaseClasses,
  emptyStateClasses,
  infoTextClasses,
  tableHeaderClasses,
  tableRowClasses,
} from "../styles/ui";

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
    <div className="flex w-full flex-1 flex-col gap-8">
      <SectionCard
        title="Platform health"
        subtitle="Watch the forest grow while keeping it safe"
      >
        {error && (
          <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
            {error}
          </p>
        )}
        {overview ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          <p className={emptyStateClasses}>No data available yet.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Form library"
        subtitle="Manage prompts that journalers and mentors can use"
      >
        {forms.length ? (
          <div className="space-y-3">
            <div className={tableHeaderClasses}>
              <span>Title</span>
              <span>Visibility</span>
              <span>Assignments</span>
            </div>
            {forms.map((form) => (
              <div className={tableRowClasses} key={form.id}>
                <span className="font-semibold text-emerald-900">{form.title}</span>
                <span className={`${chipBaseClasses} capitalize`}>{form.visibility}</span>
                <span className="text-sm text-emerald-900/70">{form.assignments}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={emptyStateClasses}>
            No forms yet. Create prompts to empower mentors.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Mentor directory"
        subtitle="Support and onboard guides who hold space for journalers"
      >
        {mentors.length ? (
          <ul className="grid gap-4">
            {mentors.map((mentor) => (
              <li
                key={mentor.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-5"
              >
                <div className="space-y-1">
                  <p className="text-base font-semibold text-emerald-900">
                    {mentor.name}
                  </p>
                  <p className={infoTextClasses}>
                    {mentor.expertise || "Expertise not provided"}
                  </p>
                </div>
                <span className={`${chipBaseClasses} text-xs uppercase`}> 
                  {mentor.mentee_count} mentees
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={emptyStateClasses}>No mentors onboarded yet.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default AdminDashboard;
