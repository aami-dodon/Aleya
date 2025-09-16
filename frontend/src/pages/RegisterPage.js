import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "journaler", label: "Journaler" },
  { value: "mentor", label: "Mentor" },
  { value: "admin", label: "Administrator" },
];

function RegisterPage() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
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
    setForm((prev) => ({ ...prev, [name]: value }));
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
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

        {error && <p className="form-error">{error}</p>}
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
