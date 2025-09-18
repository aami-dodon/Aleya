import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  displayTextClasses,
  eyebrowTextClasses,
  formLabelClasses,
  inputClasses,
  leadTextClasses,
  primaryButtonClasses,
  selectClasses,
  textareaClasses,
  xSmallHeadingClasses,
} from "../styles/ui";
import TIMEZONE_OPTIONS from "../utils/timezones";

const ROLES = [
  { value: "journaler", label: "Journaler" },
  { value: "mentor", label: "Mentor" },
];

function RegisterPage() {
  const { register, error } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [mentorApplicationSubmitted, setMentorApplicationSubmitted] =
    useState(false);
  const [mentorApprovalMessage, setMentorApprovalMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "journaler",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    mentorProfile: {
      expertise: "",
      availability: "",
      bio: "",
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLocalError(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMentorChange = (event) => {
    const { name, value } = event.target;
    setLocalError(null);
    setForm((prev) => ({
      ...prev,
      mentorProfile: { ...prev.mentorProfile, [name]: value },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setLocalError("Passwords must match");
      return;
    }

    setMentorApplicationSubmitted(false);
    setMentorApprovalMessage("");
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        timezone: form.timezone,
      };

      if (form.role === "mentor") {
        payload.mentorProfile = form.mentorProfile;
      }

      const response = await register(payload);
      setVerificationDetails(response);
      setSubmittedEmail((response?.email || form.email || "").trim());
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      if (err?.details?.code === "mentor_approval_required") {
        setSubmittedEmail((form.email || "").trim());
        setMentorApprovalMessage(
          err?.message ||
            "Thanks for your interest in mentoring. We'll email you once an administrator approves your application."
        );
        setMentorApplicationSubmitted(true);
        setLocalError(null);
        return;
      }

      if (err?.details?.errors?.length) {
        setLocalError(err.details.errors[0].msg || err.message);
      } else if (err?.message) {
        setLocalError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (mentorApplicationSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white/80 p-10 text-center shadow-2xl shadow-emerald-900/10 backdrop-blur">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className={`${displayTextClasses} text-emerald-900`}>
            Mentor application received
          </h1>
          <p className={`mt-4 ${leadTextClasses} text-emerald-900/80`}>
            {mentorApprovalMessage}
          </p>
          {submittedEmail && (
            <p className={`mt-3 ${bodySmallMutedTextClasses} text-emerald-900/70`}>
              We'll reach out at <span className="font-semibold">{submittedEmail}</span> once a decision has been made.
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setMentorApplicationSubmitted(false);
              setMentorApprovalMessage("");
            }}
            className={`mt-8 inline-flex items-center justify-center gap-2 ${primaryButtonClasses}`}
          >
            Return to registration
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const expiresHours = verificationDetails?.verificationExpiresInHours;
    const expiresCopy =
      typeof expiresHours === "number"
        ? expiresHours === 1
          ? "within 1 hour"
          : `within ${expiresHours} hours`
        : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white/80 p-10 text-center shadow-2xl shadow-emerald-900/10 backdrop-blur">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className={`${displayTextClasses} text-emerald-900`}>Check your inbox</h1>
          <p className={`mt-4 ${leadTextClasses} text-emerald-900/80`}>
            We've sent a verification link to {submittedEmail || "your email"}.
            Follow the link to activate your account.
          </p>
          {verificationDetails?.message && (
            <p
              className={`mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-6 py-4 ${bodySmallStrongTextClasses} text-emerald-900/80`}
            >
              {verificationDetails.message}
            </p>
          )}
          {expiresCopy && (
            <p className={`mt-3 ${bodySmallMutedTextClasses} text-emerald-900/70`}>
              The link will expire {expiresCopy}. If it doesn't arrive within a
              few minutes, check your spam or junk folder.
            </p>
          )}
          <Link
            to="/login"
            className={`mt-8 inline-flex items-center justify-center gap-2 ${primaryButtonClasses}`}
          >
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6 text-emerald-900">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            🌱 New to Aleya
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Join Aleya
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Create an account to start journaling, mentor others, or steward the
            platform. Your journey toward mindful growth begins here.
          </p>
          <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Journalers
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Reflect with guided prompts and track meaningful insights.
              </p>
            </div>
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Mentors
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Share your wisdom, set your availability, and support others.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur md:p-10">
          <div className="mb-8 space-y-2 text-center">
            <p className={`${eyebrowTextClasses} text-emerald-600`}>
              Create your account
            </p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
              Fill in the details to unlock journaling and mentoring tools.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className={`block ${formLabelClasses}`}>
              Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="Your full name"
              />
            </label>
            <label className={`block ${formLabelClasses}`}>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClasses}
                placeholder="name@email.com"
              />
            </label>
            <label className={`block ${formLabelClasses}`}>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className={inputClasses}
                placeholder="Choose a secure password"
              />
            </label>
            <label className={`block ${formLabelClasses}`}>
              Retype password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className={inputClasses}
                placeholder="Confirm your password"
              />
            </label>
            <label className={`block ${formLabelClasses}`}>
              Role
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`${selectClasses} appearance-none pr-10`}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            {form.role === "mentor" && (
              <p
                className={`-mt-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 ${bodySmallMutedTextClasses} text-emerald-900/70`}
              >
                Mentor accounts require administrator approval. Submit your
                application below and we'll notify you when it's accepted.
              </p>
            )}
            <label className={`block ${formLabelClasses}`}>
              Timezone
              <select
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                className={`${selectClasses} appearance-none pr-10`}
              >
                <option value="">Select your timezone</option>
                {TIMEZONE_OPTIONS.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </label>

            {form.role === "mentor" && (
              <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <h3 className={`${xSmallHeadingClasses} text-emerald-900`}>
                  Mentor profile
                </h3>
                <label className={`block ${formLabelClasses}`}>
                  Expertise
                  <input
                    type="text"
                    name="expertise"
                    value={form.mentorProfile.expertise}
                    onChange={handleMentorChange}
                    className={inputClasses}
                    placeholder="What topics can you guide on?"
                  />
                </label>
                <label className={`block ${formLabelClasses}`}>
                  Availability
                  <input
                    type="text"
                    name="availability"
                    value={form.mentorProfile.availability}
                    onChange={handleMentorChange}
                    className={inputClasses}
                    placeholder="Share your availability"
                  />
                </label>
                <label className={`block ${formLabelClasses}`}>
                  Bio
                  <textarea
                    name="bio"
                    rows={3}
                    value={form.mentorProfile.bio}
                    onChange={handleMentorChange}
                    className={`${textareaClasses} resize-none`}
                    placeholder="Introduce yourself to potential journalers"
                  />
                </label>
              </div>
            )}

            {(localError || error) && (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {localError || error}
              </p>
            )}
            <button
              type="submit"
              className={`${primaryButtonClasses} w-full`}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className={`mt-6 text-center ${bodySmallMutedTextClasses} text-emerald-900/70`}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-emerald-700 transition hover:text-emerald-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
