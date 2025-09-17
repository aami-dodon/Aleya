import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "../styles/ui";

function LoginPage() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6 text-emerald-900">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            🌿 Welcome back
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Welcome back
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Continue tending your growth journey. Sign in to pick up where you
            left off.
          </p>
          <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Track momentum
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Review your reflections and notice the progress you are making.
              </p>
            </div>
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Stay connected
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Message mentors, respond to prompts, and nurture your practice.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur md:p-10">
          <div className="mb-8 space-y-2 text-center">
            <p className={`${eyebrowTextClasses} text-emerald-600`}>
              Sign in to your account
            </p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
              Enter your credentials to continue exploring Aleya.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
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
                placeholder="Enter your password"
              />
            </label>
            {error && (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              className={`${primaryButtonClasses} w-full`}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className={`mt-6 text-center ${bodySmallMutedTextClasses} text-emerald-900/70`}>
            New to Aleya?{" "}
            <Link
              to="/register"
              className="font-semibold text-emerald-700 transition hover:text-emerald-600"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
