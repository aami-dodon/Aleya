import { useMemo, useState } from "react";
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
  const token = searchParams.get("token") || "";
  const hasToken = useMemo(() => Boolean(token && token.trim().length), [token]);

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordsMismatch =
    form.password && form.confirmPassword && form.password !== form.confirmPassword;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!hasToken) {
      setErrorMessage(
        "This reset link is missing its token. Please request a new email to continue."
      );
      return;
    }

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

  const isSubmitDisabled =
    loading || !form.password || !form.confirmPassword || passwordsMismatch;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6 text-emerald-900">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            🌱 Plant a new secret
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Set a fresh password for your grove.
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Choose a new password that feels steady and safe. This link is single-use,
            fading after a short while to keep your reflections protected among the trees.
          </p>
          <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5 sm:grid-cols-2">
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
                Reset emails expire quickly. If this link no longer glows, request another from the sign-in page.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white/80 p-8 shadow-2xl shadow-emerald-900/10 backdrop-blur md:p-10">
          <div className="mb-8 space-y-2 text-center">
            <p className={`${eyebrowTextClasses} text-emerald-600`}>
              Choose your new password
            </p>
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>
              Enter and confirm your new password below. We&apos;ll guide you back once it&apos;s saved.
            </p>
          </div>
          {!hasToken && (
            <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700" role="alert">
              This reset link appears incomplete. Please request a fresh link from the
              <Link className="ml-1 font-semibold text-emerald-700 transition hover:text-emerald-600" to="/forgot-password">
                Forgot password
              </Link>{" "}
              page.
            </p>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className={`block ${formLabelClasses}`}>
              New password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
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
                onChange={handleChange}
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
              {loading ? "Planting new password..." : "Save new password"}
            </button>
          </form>
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
            Need a fresh link? Visit the{" "}
            <Link
              to="/forgot-password"
              className="font-semibold text-emerald-700 transition hover:text-emerald-600"
            >
              Forgot password
            </Link>{" "}
            page or email <a className="font-semibold text-emerald-700 transition hover:text-emerald-600" href="mailto:support@aleya.grove">support@aleya.grove</a> for guidance.
          </p>
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
