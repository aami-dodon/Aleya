import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import {
  infoTextClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "../styles/ui";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(token ? "pending" : "missing");
  const [message, setMessage] = useState(
    token ? "Verifying your email..." : "No verification token found."
  );

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      return undefined;
    }

    const verify = async () => {
      setStatus("pending");
      setMessage("Verifying your email...");
      try {
        const response = await apiClient.post("/auth/verify-email", { token });
        if (cancelled) return;
        setMessage(response?.message || "Email verified. You can now sign in.");
        setStatus("success");
      } catch (error) {
        if (cancelled) return;
        setMessage(error.message);
        setStatus("error");
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case "pending":
        return (
          <>
            <p className="text-sm font-semibold text-emerald-900/80">{message}</p>
            <p className={infoTextClasses}>This will only take a moment.</p>
          </>
        );
      case "success":
        return (
          <>
            <p className="text-sm font-semibold text-emerald-900/80">{message}</p>
            <Link to="/login" className={`${primaryButtonClasses} w-full`}>
              Continue to sign in
            </Link>
          </>
        );
      case "error":
        return (
          <>
            <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
              {message}
            </p>
            <p className={infoTextClasses}>
              Need a new link? Register again with your email to receive another
              verification message.
            </p>
            <div>
              <Link
                to="/login"
                className={`${secondaryButtonClasses} mb-2 block w-full px-5 py-2.5 text-sm`}
              >
                Return to sign in
              </Link>
              <Link
                to="/register"
                className={`${primaryButtonClasses} block w-full px-5 py-2.5 text-sm`}
              >
                Register again
              </Link>
            </div>
          </>
        );
      case "missing":
      default:
        return (
          <>
            <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600">
              {message}
            </p>
            <p className={infoTextClasses}>
              Double-check the link in your email or start a new registration to
              receive a fresh one.
            </p>
            <Link
              to="/register"
              className={`${primaryButtonClasses} mt-2 block w-full px-5 py-2.5 text-sm`}
            >
              Register
            </Link>
          </>
        );
    }
  };

  const heading =
    status === "success"
      ? "You're verified!"
      : status === "error"
      ? "Verification issue"
      : "Verify your email";

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-emerald-100 bg-white/80 p-8 text-center shadow-2xl shadow-emerald-900/10 backdrop-blur">
      <h1 className="text-3xl font-semibold text-emerald-900">{heading}</h1>
      <div className="mt-4 space-y-4 text-left">{renderContent()}</div>
    </div>
  );
}

export default VerifyEmailPage;
