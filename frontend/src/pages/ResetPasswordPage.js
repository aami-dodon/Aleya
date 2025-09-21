import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get("token");
  const token = rawToken ? rawToken.trim() : "";
  const hasToken = useMemo(() => Boolean(token), [token]);

  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordsMismatch =
    hasToken &&
    form.password &&
    form.confirmPassword &&
    form.password !== form.confirmPassword;

  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(false);
    setForm({ password: "", confirmPassword: "" });
    setEmail("");
  }, [hasToken]);

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErrorMessage("Please share the email tied to your Aleya account.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await apiClient.post("/auth/forgot-password", {
        email: normalizedEmail,
      });
      const message =
        response?.message ||
        "If an account exists with that email, a reset link is already winging its way to you.";
      setSuccessMessage(message);
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error?.message || "We couldn't send a reset link right now. Please try again soon."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();

    if (passwordsMismatch) {
      setErrorMessage("Passwords need to match before the grove can open again.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password: form.password,
      });

      setSuccessMessage(
        "Your password has been refreshed. Sign in with your new secret to step back inside Aleya."
      );
      setForm({ password: "", confirmPassword: "" });
    } catch (error) {
      setErrorMessage(
        error?.message || "We couldn't reset your password right now. Please try again soon."
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = hasToken
    ? loading || !form.password || !form.confirmPassword || passwordsMismatch
    : loading || !email.trim();

  const heroBadge = hasToken ? "🌱 Plant a new secret" : "🔐 Gentle reset ahead";
  const heroTitle = hasToken
    ? "Set a fresh password for your grove."
    : "Restore your path to the grove.";
  const heroDescription = hasToken
    ? "Choose a new password that feels steady and safe. This link is single-use, fading after a short while to keep your reflections protected among the trees."
    : "Share the email you use with Aleya and we’ll send fresh instructions to help you step back inside.";

  const eyebrowCopy = hasToken ? "Choose your new password" : "Request a reset link";
  const panelDescription = hasToken
    ? "Enter and confirm your new password below. We’ll guide you back once it’s saved."
    : "We’ll send a single-use link that guides you through setting a new password.";

  const submitLabel = hasToken
    ? loading
      ? "Planting new password..."
      : "Save new password"
    : loading
    ? "Sending link..."
    : "Send reset link";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6 text-emerald-900">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            {heroBadge}
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>{heroTitle}</h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>{heroDescription}</p>
          <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5 sm:grid-cols-2">
            {hasToken ? (
              <>
                <div className="space-y-1">
                  <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                    Keep it luminous
                  </p>
                  <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                    Use eight or more characters and weave in unique words so only you can reopen the path.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                    Link feeling faded?
                  </p>
                  <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                    Reset emails expire quickly. If this link no longer glows, send yourself a fresh one from this page.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                    Securely tended
                  </p>
                  <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                    Reset links fade after a short while, keeping your reflections safe amongst the trees.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className={`${bodySmallStrongTextClasses} text-emerald-800`}>
                    Always connected
                  </p>
                  <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
                    If you ever feel lost, our support team will guide you back to your luminous companions.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur md:p-10">
          <div className="mb-8 space-y-2 text-center">
            <p className={`${eyebrowTextClasses} text-emerald-600`}>{eyebrowCopy}</p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>{panelDescription}</p>
          </div>
          <form
            className="space-y-5"
            onSubmit={hasToken ? handleResetSubmit : handleRequestSubmit}
          >
            {hasToken ? (
              <>
                <label className={`block ${formLabelClasses}`}>
                  New password
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleResetChange}
                    required
                    minLength={8}
                    className={inputClasses}
                    placeholder="Enter a new password"
                  />
                </label>
                <label className={`block ${formLabelClasses}`}>
                  Confirm password
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleResetChange}
                    required
                    minLength={8}
                    className={inputClasses}
                    placeholder="Retype the new password"
                  />
                </label>
                {passwordsMismatch && (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700" role="alert">
                    These passwords don&apos;t match yet. Once they align, the button will glow.
                  </p>
                )}
              </>
            ) : (
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
            )}
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
              disabled={isSubmitDisabled}
            >
              {submitLabel}
            </button>
          </form>
          {hasToken ? (
            <>
              <p className={`mt-6 text-center ${bodyTextClasses} text-emerald-900/70`}>
                Ready to return?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-emerald-700 transition hover:text-emerald-600"
                >
                  Head back to sign in
                </Link>
              </p>
              <p className={`mt-4 text-center ${bodySmallMutedTextClasses} text-emerald-900/70`}>
                Need a fresh link?{" "}
                <Link
                  to="/reset-password"
                  className="font-semibold text-emerald-700 transition hover:text-emerald-600"
                >
                  Request another reset email
                </Link>{" "}
                or email <a className="font-semibold text-emerald-700 transition hover:text-emerald-600" href="mailto:support@aleya.grove">support@aleya.grove</a> for guidance.
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className={`${secondaryButtonClasses} inline-flex w-full justify-center sm:w-auto`}
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;