import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";
import {
  checkboxClasses,
  infoTextClasses,
  inputClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  selectClasses,
  textareaClasses,
} from "../styles/ui";
import TIMEZONE_OPTIONS from "../utils/timezones";

function SettingsPage() {
  const { user, token, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    timezone: "",
    remindersDaily: false,
    remindersWeekly: true,
    mentorNotifications: "summary",
    password: "",
    mentorProfile: {
      expertise: "",
      availability: "",
      bio: "",
    },
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      timezone: user.timezone,
      remindersDaily: user.notificationPreferences?.reminders?.daily ?? false,
      remindersWeekly: user.notificationPreferences?.reminders?.weekly ?? true,
      mentorNotifications: user.notificationPreferences?.mentorNotifications || "summary",
      password: "",
      mentorProfile: user.mentorProfile || { expertise: "", availability: "", bio: "" },
    });
  }, [user]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMentorChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      mentorProfile: { ...prev.mentorProfile, [name]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      timezone: form.timezone,
      notificationPreferences: {
        reminders: {
          daily: form.remindersDaily,
          weekly: form.remindersWeekly,
        },
        mentorNotifications: form.mentorNotifications,
      },
    };
    if (form.password) {
      payload.password = form.password;
    }
    if (user.role === "mentor") {
      payload.mentorProfile = form.mentorProfile;
    }

    await updateProfile(payload);
    setMessage("Settings saved.");
  };

  const requestExport = async () => {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      setMessage(null);
      const response = await fetch(`${baseUrl}/journal-entries/export`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let reason = response.statusText || "Failed to export journal entries.";
        try {
          const data = errorText ? JSON.parse(errorText) : null;
          reason = data?.error || data?.message || reason;
        } catch (parseError) {
          reason = errorText || reason;
        }
        throw new Error(reason);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "journal-entries-export.json";

      if (contentDisposition) {
        const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (match?.[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMessage("Your journal export is downloading.");
    } catch (error) {
      console.error("Failed to export journal entries", error);
      setMessage(error?.message || "Failed to export journal entries.");
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col gap-8">
      {message && <p className={infoTextClasses}>{message}</p>}
      <SectionCard title="Profile" subtitle="Tune your account details">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-emerald-900/80">
            Name
            <input
              type="text"
              name="name"
              className={inputClasses}
              value={form.name}
              onChange={handleChange}
            />
          </label>
          <label className="block text-sm font-semibold text-emerald-900/80">
            Timezone
            <select
              name="timezone"
              className={`${selectClasses} appearance-none pr-10`}
              value={form.timezone}
              onChange={handleChange}
            >
              <option value="">Select your timezone</option>
              {TIMEZONE_OPTIONS.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-emerald-900/80">
            New password
            <input
              type="password"
              name="password"
              className={inputClasses}
              value={form.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current"
            />
          </label>

          <fieldset className="space-y-3 rounded-2xl border border-emerald-100 bg-white/60 p-4">
            <legend className="text-sm font-semibold text-emerald-900">Email reminders</legend>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="remindersDaily"
                className={checkboxClasses}
                checked={form.remindersDaily}
                onChange={handleChange}
              />
              Daily reflection reminders
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="remindersWeekly"
                className={checkboxClasses}
                checked={form.remindersWeekly}
                onChange={handleChange}
              />
              Weekly summary updates
            </label>
          </fieldset>

          <label className="block text-sm font-semibold text-emerald-900/80">
            Mentor notifications
            <select
              name="mentorNotifications"
              className={selectClasses}
              value={form.mentorNotifications}
              onChange={handleChange}
            >
              <option value="mood">Mood only</option>
              <option value="summary">Summary</option>
              <option value="full">Full entry</option>
            </select>
          </label>

          {user.role === "mentor" && (
            <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white/60 p-5">
              <h3 className="text-lg font-semibold text-emerald-900">Mentor profile</h3>
              <label className="block text-sm font-semibold text-emerald-900/80">
                Expertise
                <input
                  type="text"
                  name="expertise"
                  className={inputClasses}
                  value={form.mentorProfile.expertise}
                  onChange={handleMentorChange}
                />
              </label>
              <label className="block text-sm font-semibold text-emerald-900/80">
                Availability
                <input
                  type="text"
                  name="availability"
                  className={inputClasses}
                  value={form.mentorProfile.availability}
                  onChange={handleMentorChange}
                />
              </label>
              <label className="block text-sm font-semibold text-emerald-900/80">
                Bio
                <textarea
                  name="bio"
                  rows={3}
                  className={textareaClasses}
                  value={form.mentorProfile.bio}
                  onChange={handleMentorChange}
                />
              </label>
            </div>
          )}

          <button type="submit" className={`${primaryButtonClasses} w-full md:w-auto`}>
            Save changes
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Data & privacy" subtitle="You can request an export anytime">
        <button
          type="button"
          className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
          onClick={requestExport}
        >
          Request journal export
        </button>
      </SectionCard>
    </div>
  );
}

export default SettingsPage;
