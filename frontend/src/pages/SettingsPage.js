import { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard";
import TagInput from "../components/TagInput";
import { useAuth } from "../context/AuthContext";
import {
  checkboxClasses,
  bodySmallTextClasses,
  infoTextClasses,
  inputClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  selectClasses,
  textareaClasses,
} from "../styles/ui";
import TIMEZONE_OPTIONS from "../utils/timezones";
import { useExpertiseSuggestions } from "../hooks/useExpertiseSuggestions";
import { formatExpertise, parseExpertise } from "../utils/expertise";

function SettingsPage() {
  const { user, token, updateProfile, deleteAccount } = useAuth();
  const isAdmin = user?.role === "admin";
  const [form, setForm] = useState({
    name: "",
    email: "",
    timezone: "",
    remindersDaily: false,
    remindersWeekly: true,
    mentorNotifications: "summary",
    notificationsEmail: true,
    notificationsInApp: true,
    notifyAccount: true,
    notifyMentorship: true,
    notifyForms: true,
    notifyExports: true,
    notifyAlerts: true,
    password: "",
    mentorProfile: {
      expertise: [],
      availability: "",
      bio: "",
    },
  });
  const [message, setMessage] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { suggestions: expertiseSuggestions } = useExpertiseSuggestions({ limit: 40 });

  useEffect(() => {
    if (!user) return;
    const mentorProfile = user.mentorProfile || { expertise: "", availability: "", bio: "" };

    setForm({
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      remindersDaily: user.notificationPreferences?.reminders?.daily ?? false,
      remindersWeekly: user.notificationPreferences?.reminders?.weekly ?? true,
      mentorNotifications: user.notificationPreferences?.mentorNotifications || "summary",
      notificationsEmail: user.notificationPreferences?.channels?.email ?? true,
      notificationsInApp: user.notificationPreferences?.channels?.inApp ?? true,
      notifyAccount: user.notificationPreferences?.categories?.account ?? true,
      notifyMentorship: user.notificationPreferences?.categories?.mentorship ?? true,
      notifyForms: user.notificationPreferences?.categories?.forms ?? true,
      notifyExports: user.notificationPreferences?.categories?.exports ?? true,
      notifyAlerts: user.notificationPreferences?.categories?.alerts ?? true,
      password: "",
      mentorProfile: {
        expertise: parseExpertise(mentorProfile.expertise),
        availability: mentorProfile.availability || "",
        bio: mentorProfile.bio || "",
      },
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

  const handleExpertiseChange = (nextExpertise) => {
    setForm((prev) => ({
      ...prev,
      mentorProfile: { ...prev.mentorProfile, expertise: parseExpertise(nextExpertise) },
    }));
  };

  const handleDeletePasswordChange = (event) => {
    setDeletePassword(event.target.value);
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    if (!deletePassword) {
      setMessage("Please enter your password to delete your account.");
      return;
    }

    const confirmed = window.confirm(
      "Deleting your Aleya account will permanently remove all of your data. This cannot be undone. Do you want to continue?"
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setIsDeleting(true);

    try {
      await deleteAccount(deletePassword);
      window.alert("Your Aleya account has been permanently deleted.");
    } catch (error) {
      console.error("Failed to delete account", error);
      setMessage(error?.message || "Failed to delete account.");
    } finally {
      setDeletePassword("");
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      timezone: form.timezone,
      notificationPreferences: {
        reminders: {
          daily: form.remindersDaily,
          weekly: form.remindersWeekly,
        },
        mentorNotifications: form.mentorNotifications,
        channels: {
          email: form.notificationsEmail,
          inApp: form.notificationsInApp,
        },
        categories: {
          account: form.notifyAccount,
          mentorship: form.notifyMentorship,
          forms: form.notifyForms,
          exports: form.notifyExports,
          alerts: form.notifyAlerts,
        },
      },
    };
    if (form.password) {
      payload.password = form.password;
    }
    if (user.role === "mentor") {
      payload.mentorProfile = {
        ...form.mentorProfile,
        expertise: formatExpertise(form.mentorProfile.expertise),
      };
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
        <form
          className="space-y-5"
          onSubmit={isAdmin ? (event) => event.preventDefault() : handleSubmit}
        >
          {isAdmin && (
            <p className={`${bodySmallTextClasses} text-emerald-900/70`}>
              Admin settings are curated by the Aleya team. Reach out to the support
              grove if you need a helping hand with account updates.
            </p>
          )}
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
            Email address
            <input
              type="email"
              name="email"
              className={inputClasses}
              value={form.email}
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

          {!isAdmin && (
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
          )}

          <fieldset className="space-y-3 rounded-2xl border border-emerald-100 bg-white/60 p-4">
            <legend className="text-sm font-semibold text-emerald-900">
              Notification channels
            </legend>
            <p className={`${bodySmallTextClasses} text-emerald-900/70`}>
              Choose how Aleya reaches you with updates.
            </p>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="notificationsEmail"
                className={checkboxClasses}
                checked={form.notificationsEmail}
                onChange={handleChange}
              />
              Email notifications
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="notificationsInApp"
                className={checkboxClasses}
                checked={form.notificationsInApp}
                onChange={handleChange}
              />
              In-app alerts
            </label>
          </fieldset>

          <fieldset className="space-y-3 rounded-2xl border border-emerald-100 bg-white/60 p-4">
            <legend className="text-sm font-semibold text-emerald-900">
              Notification categories
            </legend>
            <p className={`${bodySmallTextClasses} text-emerald-900/70`}>
              Toggle the types of alerts you want to receive.
            </p>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="notifyAccount"
                className={checkboxClasses}
                checked={form.notifyAccount}
                onChange={handleChange}
              />
              Account and security
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="notifyMentorship"
                className={checkboxClasses}
                checked={form.notifyMentorship}
                onChange={handleChange}
              />
              Mentorship updates
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="notifyForms"
                className={checkboxClasses}
                checked={form.notifyForms}
                onChange={handleChange}
              />
              Forms and assignments
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="notifyExports"
                className={checkboxClasses}
                checked={form.notifyExports}
                onChange={handleChange}
              />
              Data exports
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900/80">
              <input
                type="checkbox"
                name="notifyAlerts"
                className={checkboxClasses}
                checked={form.notifyAlerts}
                onChange={handleChange}
              />
              Urgent alerts
            </label>
          </fieldset>

          {!isAdmin && (
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
          )}

          {user.role === "mentor" && (
            <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white/60 p-5">
              <h3 className="text-lg font-semibold text-emerald-900">Mentor profile</h3>
              <label className="block text-sm font-semibold text-emerald-900/80">
                Expertise
                <TagInput
                  value={form.mentorProfile.expertise}
                  onChange={handleExpertiseChange}
                  suggestions={expertiseSuggestions}
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

          {!isAdmin && (
            <button type="submit" className={`${primaryButtonClasses} w-full md:w-auto`}>
              Save changes
            </button>
          )}
        </form>
      </SectionCard>
      {!isAdmin && (
        <SectionCard title="Data & privacy" subtitle="You can request an export anytime">
          <div className="space-y-5">
            <p className={`${bodySmallTextClasses} text-emerald-900/80`}>
              Download your reflections before you close your account. Once you
              request deletion, Aleya permanently removes your journals and we
              will not be able to recover them.
            </p>

            <button
              type="button"
              className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
              onClick={requestExport}
            >
              Request journal export
            </button>

            <form
              className="space-y-4 rounded-2xl border border-emerald-100 bg-white/60 p-5"
              onSubmit={handleDeleteAccount}
            >
              <p className={`${bodySmallTextClasses} text-rose-600`}>
                Deleting your account is permanent. Enter your password to
                confirm you understand Aleya will not retain any of your data.
              </p>

              <label className="block text-sm font-semibold text-emerald-900/80">
                Account password
                <input
                  type="password"
                  name="deletePassword"
                  className={inputClasses}
                  value={deletePassword}
                  onChange={handleDeletePasswordChange}
                  placeholder="Enter your password to continue"
                />
              </label>

              <button
                type="submit"
                className={`${secondaryButtonClasses} border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting account..." : "Delete account"}
              </button>
            </form>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default SettingsPage;
