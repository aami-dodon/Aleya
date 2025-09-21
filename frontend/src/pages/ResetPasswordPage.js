import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  displayTextClasses,
  formLabelClasses,
  infoTextClasses,
  inputClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "../styles/ui";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(
    token
      ? { type: "idle", message: "" }
      : {
          type: "missing",
          message:
            "This reset link is missing its token. Request a new email to continue.",
        },
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus({
        type: "missing",
        message:
          "This reset link is missing its token. Request a new email to continue.",
      });
      return;
    }

    if (password.length < 8) {
      setStatus({
        type: "error",
        message: "Passwords need at least 8 characters to feel secure.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Those passwords do not match. Please try again.",
      });
      return;
    }

    setLoading(true);
    setStatus({ type: "pending", message: "Refreshing your password..." });

    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });

      setStatus({
        type: "success",
        message:
          response?.message ||
          "Your password has been renewed. You can step back inside Aleya now.",
      });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.message ||
          "We couldn't refresh your password just yet. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusMessage = () => {
    if (!status.type || status.type === "idle") {
      return null;
    }

    if (status.type === "pending") {
      return (
        <p className={`${bodySmallStrongTextClasses} text-emerald-900/80`}>
          {status.message}
        </p>
      );
    }

    if (status.type === "success") {
      return (
        <div className="space-y-3">
          <p className={`${bodySmallStrongTextClasses} text-emerald-700`}>
            {status.message}
          </p>
          <Link to="/login" className={`${primaryButtonClasses} block w-full`}>
            Continue to sign in
          </Link>
        </div>
      );
    }

    if (status.type === "missing") {
      return (
        <div className="space-y-3">
          <p
            className={`rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 ${bodySmallStrongTextClasses} text-rose-600`}
          >
            {status.message}
          </p>
          <Link
            to="/forgot-password"
            className={`${secondaryButtonClasses} block w-full`}
          >
            Request a new link
          </Link>
        </div>
      );
    }

    return (
      <p
        className={`rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 ${bodySmallStrongTextClasses} text-rose-600`}
      >
        {status.message}
      </p>
    );
  };

  const heading =
    status.type === "success" ? "Password refreshed" : "Choose a new password";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-emerald-100 bg-white/80 p-10 shadow-2xl shadow-emerald-900/10 backdrop-blur">
        <div className="mb-8 space-y-3 text-center text-emerald-900">
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            🔑 Renew your key
          </span>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            {heading}
          </h1>
          {status.type !== "success" && (
            <p className={`${bodySmallMutedTextClasses} text-emerald-900/80`}>
              Craft a new password to reopen your path beneath the Aleya canopy.
            </p>
          )}
        </div>

        {status.type !== "success" && (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className={`block text-left ${formLabelClasses}`}>
              New password
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className={inputClasses}
                minLength={8}
                placeholder="At least 8 characters"
                disabled={loading || status.type === "missing"}
              />
            </label>
            <label className={`block text-left ${formLabelClasses}`}>
              Confirm password
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className={inputClasses}
                minLength={8}
                placeholder="Retype your new password"
                disabled={loading || status.type === "missing"}
              />
            </label>
            {renderStatusMessage()}
            <button
              type="submit"
              className={`${primaryButtonClasses} w-full`}
              disabled={loading || status.type === "missing"}
            >
              {loading ? "Refreshing..." : "Reset password"}
            </button>
          </form>
        )}

        {status.type === "success" && (
          <div className="space-y-4 text-left">
            {renderStatusMessage()}
            <p className={`${infoTextClasses} text-emerald-900/70`}>
              If this wasn’t you, we recommend updating your email security and
              letting your mentors know.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
