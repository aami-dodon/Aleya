import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, requestMagicLink, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [magicStatus, setMagicStatus] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    try {
      await requestMagicLink(form.email);
      setMagicStatus("Magic link sent! Check your inbox.");
    } catch (err) {
      setMagicStatus(err.message);
    }
  };

  return (
    <div className="auth-page">
      <h1>Welcome back</h1>
      <p className="page-subtitle">
        Continue tending your growth journey. Log in with your credentials or
        request a magic link.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
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
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <button type="button" className="ghost-button" onClick={handleMagicLink}>
        Send me a magic link
      </button>
      {magicStatus && <p className="info-text">{magicStatus}</p>}
      <p className="info-text">
        New to Aleya? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}

export default LoginPage;
