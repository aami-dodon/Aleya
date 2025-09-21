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
            🌿 Returning to the grove
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Welcome back to your luminous grove.
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Continue tending the practice you planted. Step inside to gather
            yesterday's wisdom and set intention for today.
          </p>
          <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Trace your rhythm
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Revisit your reflections and witness how each note becomes a
                new ring of growth.
              </p>
            </div>
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Stay entwined
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Share with mentors, respond to gentle prompts, and let your
                practice stay companioned.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur md:p-10">
          <div className="mb-8 space-y-2 text-center">
            <p className={`${eyebrowTextClasses} text-emerald-600`}>
              Step back into Aleya
            </p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
              Enter your credentials to reopen the pathways you’ve been
              tending.
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
            <div className="text-right">
              <Link
                to="/reset-password"
                className={`${bodySmallStrongTextClasses} inline-flex items-center justify-end gap-1 text-emerald-700 underline decoration-emerald-300 decoration-2 underline-offset-4 transition hover:text-emerald-600`}
              >
                <span aria-hidden="true">Forgot your password?</span>
                <span className="sr-only">Forgot your password? Reset it.</span>
              </Link>
            </div>
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
              Plant your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
