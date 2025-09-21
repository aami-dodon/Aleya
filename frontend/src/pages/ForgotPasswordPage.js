import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  displayTextClasses,
  formLabelClasses,
  inputClasses,
  primaryButtonClasses,
} from "../styles/ui";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStatus({
        type: "success",
        message:
          "If an account is nestled beneath this email, a fresh reset path will arrive in your inbox shortly.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.message ||
          "We couldn't send the reset whisper just yet. Please try again in a few moments.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-emerald-100 bg-white/80 p-10 shadow-2xl shadow-emerald-900/10 backdrop-blur">
        <div className="mb-8 space-y-3 text-center text-emerald-900">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            🔐 Restore your access
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            We'll guide you back to the grove.
          </h1>
          <p className={`${bodySmallMutedTextClasses} text-emerald-900/80`}>
            Share the email you used to plant your account. We’ll send along a shimmering reset link so you can step back inside.
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className={`block text-left ${formLabelClasses}`}>
            Email
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={inputClasses}
              placeholder="name@email.com"
            />
          </label>
          {status.type === "success" && (
            <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {status.message}
            </p>
          )}
          {status.type === "error" && (
            <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {status.message}
            </p>
          )}
          <button
            type="submit"
            className={`${primaryButtonClasses} w-full`}
            disabled={loading}
          >
            {loading ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>
        <p className={`mt-6 text-center ${bodySmallMutedTextClasses} text-emerald-900/70`}>
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-emerald-700 transition hover:text-emerald-600"
          >
            Return to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
