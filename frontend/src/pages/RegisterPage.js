import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      if (err?.details?.errors?.length) {
        setLocalError(err.details.errors[0].msg || err.message);
      } else if (err?.message) {
        setLocalError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const expiresHours = verificationDetails?.verificationExpiresInHours;
    const expiresCopy =
      typeof expiresHours === "number"
        ? expiresHours === 1
          ? "within 1 hour"
          : `within ${expiresHours} hours`
        : null;

    return (
      <div className="auth-page">
        <h1>Check your inbox</h1>
        <p className="page-subtitle">
          We've sent a verification link to {submittedEmail || "your email"}.
          Follow the link to activate your account.
        </p>
        {verificationDetails?.message && (
          <p className="info-text">{verificationDetails.message}</p>
        )}
        {expiresCopy && (
          <p className="info-text">
            The link will expire {expiresCopy}. If it doesn't arrive within a few
            minutes, check your spam or junk folder.
          </p>
        )}
        <Link to="/login" className="primary-button">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1>Join Aleya</h1>
      <p className="page-subtitle">
        Create an account to start journaling, mentor others, or steward the
        platform.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </label>
        <label>
          Retype password
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
          />
        </label>
        <label>
          Role
          <select name="role" value={form.role} onChange={handleChange}>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
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

        {form.role === "mentor" && (
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

        {(localError || error) && (
          <p className="form-error">{localError || error}</p>
        )}
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="info-text">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
