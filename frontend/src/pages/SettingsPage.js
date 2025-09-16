import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import { useAuth } from "../context/AuthContext";

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
    <div className="dashboard-page">
      {message && <p className="info-text">{message}</p>}
      <SectionCard title="Profile" subtitle="Tune your account details">
        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input type="text" name="name" value={form.name} onChange={handleChange} />
          </label>
          <label>
            Timezone
            <input
              type="text"
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current"
            />
          </label>

          <fieldset>
            <legend>Email reminders</legend>
            <label className="checkbox">
              <input
                type="checkbox"
                name="remindersDaily"
                checked={form.remindersDaily}
                onChange={handleChange}
              />
              Daily reflection reminders
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                name="remindersWeekly"
                checked={form.remindersWeekly}
                onChange={handleChange}
              />
              Weekly summary updates
            </label>
          </fieldset>

          <label>
            Mentor notifications
            <select
              name="mentorNotifications"
              value={form.mentorNotifications}
              onChange={handleChange}
            >
              <option value="mood">Mood only</option>
              <option value="summary">Summary</option>
              <option value="full">Full entry</option>
            </select>
          </label>

          {user.role === "mentor" && (
            <div className="mentor-fields">
              <h3>Mentor profile</h3>
              <label>
                Expertise
                <input
                  type="text"
                  name="expertise"
                  value={form.mentorProfile.expertise}
                  onChange={handleMentorChange}
                />
              </label>
              <label>
                Availability
                <input
                  type="text"
                  name="availability"
                  value={form.mentorProfile.availability}
                  onChange={handleMentorChange}
                />
              </label>
              <label>
                Bio
                <textarea
                  name="bio"
                  rows={3}
                  value={form.mentorProfile.bio}
                  onChange={handleMentorChange}
                />
              </label>
            </div>
          )}

          <button type="submit" className="primary-button">
            Save changes
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Data & privacy" subtitle="You can request an export anytime">
        <button type="button" className="ghost-button" onClick={requestExport}>
          Request journal export
        </button>
      </SectionCard>
    </div>
  );
}

export default SettingsPage;
