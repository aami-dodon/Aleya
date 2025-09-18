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
import { parseExpertise } from "../utils/expertise";

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

  const getVisibilityLabel = (form) => {
    if (form.is_default) {
      return "Default template";
    }

    switch (form.visibility) {
      case "mentor":
        return "Mentor library";
      case "admin":
        return "Admin only";
      case "journaler":
        return "Journaler library";
      default:
        return "Shared";
    }
  };

  const getAssignmentLabel = (form) => {
    if (form.is_default) {
      return "Available to every journaler";
    }

    const total = Number(form.assignments) || 0;

    if (total === 0) {
      return "Not assigned yet";
    }

    if (total === 1) {
      return "Assigned to 1 journaler";
    }

    return `Assigned to ${total} journalers`;
  };

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
            <div className={`${tableHeaderClasses} md:px-4`}>
              <span>Title</span>
              <span>Visibility</span>
              <span className="md:text-right">Assignments</span>
            </div>
            {forms.map((form) => {
              const visibilityLabel = getVisibilityLabel(form);
              const assignmentLabel = getAssignmentLabel(form);

              return (
                <div className={tableRowClasses} key={form.id}>
                  <div>
                    <p className="font-semibold text-emerald-900">{form.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-emerald-900/70 md:hidden">
                      <span className={chipBaseClasses}>{visibilityLabel}</span>
                      <span>{assignmentLabel}</span>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span className={chipBaseClasses}>{visibilityLabel}</span>
                  </div>
                  <div className="hidden text-sm text-emerald-900/80 md:block md:text-right">
                    {assignmentLabel}
                  </div>
                </div>
              );
            })}
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
            {mentors.map((mentor) => {
              const expertiseTags = parseExpertise(mentor.expertise);
              return (
                <li
                  key={mentor.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/70 p-5"
                >
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-emerald-900">
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
                      <p className={infoTextClasses}>Expertise not provided</p>
                    )}
                  </div>
                  <span className={`${chipBaseClasses} text-xs uppercase`}>
                    {mentor.mentee_count} mentees
                  </span>
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

export default AdminDashboard;
