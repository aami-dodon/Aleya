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
import TagInput from "../components/TagInput";
import { formatExpertise, parseExpertise } from "../utils/expertise";

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
      expertise: [],
      availability: "",
      bio: "",
    },
  });

  const passwordsMismatch =
    form.confirmPassword && form.password !== form.confirmPassword;

  const syncPasswordMismatchError = (nextForm) => {
    if (
      nextForm.confirmPassword &&
      nextForm.password !== nextForm.confirmPassword
    ) {
      setLocalError("Passwords must match");
    } else {
      setLocalError(null);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const nextForm = { ...prev, [name]: value };

      if (name === "password" || name === "confirmPassword") {
        syncPasswordMismatchError(nextForm);
      } else {
        setLocalError(null);
      }

      return nextForm;
    });
  };

  const handleMentorChange = (event) => {
    const { name, value } = event.target;
    setLocalError(null);
    setForm((prev) => ({
      ...prev,
      mentorProfile: { ...prev.mentorProfile, [name]: value },
    }));
  };

  const handleExpertiseChange = (nextExpertise) => {
    setLocalError(null);
    setForm((prev) => ({
      ...prev,
      mentorProfile: { ...prev.mentorProfile, expertise: parseExpertise(nextExpertise) },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (passwordsMismatch) {
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
        payload.mentorProfile = {
          ...form.mentorProfile,
          expertise: formatExpertise(form.mentorProfile.expertise),
        };
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
            "Thank you for offering your guidance. We'll email you as soon as an administrator lights the green lantern of approval."
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
            Your mentor lantern is on its way
          </h1>
          <p className={`mt-4 ${leadTextClasses} text-emerald-900/80`}>
            {mentorApprovalMessage}
          </p>
          {submittedEmail && (
            <p className={`mt-3 ${bodySmallMutedTextClasses} text-emerald-900/70`}>
              We'll reach out at <span className="font-semibold">{submittedEmail}</span> as soon as an administrator completes the welcome.
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
            Return to the form
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
          <h1 className={`${displayTextClasses} text-emerald-900`}>
            Watch for the Aleya lantern
          </h1>
          <p className={`mt-4 ${leadTextClasses} text-emerald-900/80`}>
            We've sent a verification link to {submittedEmail || "your email"} so
            you can kindle your new account. Follow the glow to finish arriving.
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
              The link will fade {expiresCopy}. If it doesn't appear soon, peek in
              your spam or junk folders.
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
            🌱 Arriving at Aleya
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Begin your luminous account
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Plant your name in Aleya to journal with intention, offer your wisdom,
            or steward the sanctuary for others. This is the first ring of your new
            practice.
          </p>
          <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Journalers
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Reflect with guided prompts and gather the insights that shimmer
                through your days.
              </p>
            </div>
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Mentors
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Share your wisdom, set gentle rhythms, and support others as they
                unfurl.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur md:p-10">
          <div className="mb-8 space-y-2 text-center">
            <p className={`${eyebrowTextClasses} text-emerald-600`}>
              Shape your presence
            </p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
              Share a few details to unlock Aleya’s journals, mentorship, and
              stewardship tools.
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
                className={`${inputClasses} ${
                  passwordsMismatch
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    : ""
                }`}
                placeholder="Confirm your password"
                aria-invalid={passwordsMismatch}
                aria-describedby={
                  passwordsMismatch ? "confirm-password-error" : undefined
                }
              />
              {passwordsMismatch && (
                <p
                  id="confirm-password-error"
                  className={`mt-2 ${bodySmallStrongTextClasses} text-rose-600`}
                >
                  Passwords must match before you can continue.
                </p>
              )}
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
                Mentor accounts require an administrator’s blessing. Submit your
                application below and we’ll send word when the invitation is lit.
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
                  <TagInput
                    value={form.mentorProfile.expertise}
                    onChange={handleExpertiseChange}
                    placeholder="Press Enter to add each area of expertise"
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
                    placeholder="Share when you can hold space"
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
              disabled={loading || passwordsMismatch}
            >
              {loading ? "Rooting your account..." : "Create luminous account"}
            </button>
          </form>
          <p className={`mt-6 text-center ${bodySmallMutedTextClasses} text-emerald-900/70`}>
            Already tending a space?{" "}
            <Link
              to="/login"
              className="font-semibold text-emerald-700 transition hover:text-emerald-600"
            >
              Step inside
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
