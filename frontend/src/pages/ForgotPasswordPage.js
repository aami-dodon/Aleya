import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  bodyTextClasses,
  displayTextClasses,
  eyebrowTextClasses,
  formLabelClasses,
  inputClasses,
  leadTextClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "../styles/ui";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      const message =
        response?.message ||
        "If an account exists with that email, a reset link is on its way.";
      setSuccessMessage(message);
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "We couldn't send a reset link right now. Please try again soon."
      );
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
            🔐 Gentle reset ahead
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Restore your path to the grove.
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Share the email you use with Aleya and we&apos;ll send fresh instructions
            to help you step back inside.
          </p>
          <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Securely tended
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Reset links fade after a short while, keeping your reflections
                safe amongst the trees.
              </p>
            </div>
            <div className="space-y-1">
              <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                Always connected
              </p>
              <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                If you ever feel lost, our support team will guide you back to
                your luminous companions.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur md:p-10">
          <div className="mb-8 space-y-2 text-center">
            <p className={`${eyebrowTextClasses} text-emerald-600`}>
              Request a reset link
            </p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
              We&apos;ll send a single-use link that guides you through setting a new
              password.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className={`block ${formLabelClasses}`}>
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
            {errorMessage && (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600" role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700" role="status">
                {successMessage}
              </p>
            )}
            <button
              type="submit"
              className={`${primaryButtonClasses} w-full`}
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>
          <p className={`mt-6 text-center ${bodyTextClasses} text-emerald-900/70`}>
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-emerald-700 transition hover:text-emerald-600"
            >
              Return to sign in
            </Link>
          </p>
          <p className={`mt-4 text-center ${bodySmallMutedTextClasses} text-emerald-900/70`}>
            Need more help? Reach out to <a className="font-semibold text-emerald-700 transition hover:text-emerald-600" href="mailto:support@aleya.grove">support@aleya.grove</a> and we&apos;ll lend a hand.
          </p>
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className={`${secondaryButtonClasses} inline-flex w-full justify-center sm:w-auto`}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
