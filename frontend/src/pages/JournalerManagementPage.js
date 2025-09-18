import { useEffect, useState } from "react";
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
  secondaryButtonClasses,
} from "../styles/ui";

function JournalerManagementPage() {
  const { token } = useAuth();
  const [journalers, setJournalers] = useState([]);
  const [journalerSearch, setJournalerSearch] = useState("");
  const [journalerQuery, setJournalerQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

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
    setJournalerQuery(journalerSearch.trim().toLowerCase());
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

  if (loading) {
    return <LoadingState label="Loading journalers" />;
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      {message && <p className={infoTextClasses}>{message}</p>}
      <SectionCard
        title="Journaler management"
        subtitle="Shepherd every journaler's journey, review their mentor ties, and gently close accounts that need to rest"
        action={
          <form className="flex flex-wrap items-center gap-3" onSubmit={handleJournalerSearch}>
            <input
              type="search"
              placeholder="Search by name or email"
              value={journalerSearch}
              onChange={(event) => setJournalerSearch(event.target.value)}
              className={`${inputCompactClasses} w-full sm:w-72`}
            />
            <button type="submit" className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}>
              Search journalers
            </button>
          </form>
        }
      >
        {journalers.length ? (
          <ul className="space-y-6">
            {journalers.map((journaler) => {
              const mentorList = Array.isArray(journaler.mentors) ? journaler.mentors : [];

              return (
                <li key={journaler.id} className="rounded-2xl border border-emerald-100 bg-white/70 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-emerald-900">{journaler.name}</p>
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
                                  <p className="text-sm font-semibold text-emerald-900">{mentor.name || "Mentor"}</p>
                                  <p className={`${captionTextClasses} text-emerald-900/70`}>{mentor.email}</p>
                                </div>
                                <button
                                  type="button"
                                  className={`${secondaryButtonClasses} px-3 py-1 text-xs`}
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
                          <p className={infoTextClasses}>Not yet connected to a mentor.</p>
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
    </div>
  );
}

export default JournalerManagementPage;

