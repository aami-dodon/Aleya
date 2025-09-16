import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";

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
            <p className="page-subtitle">{message}</p>
            <p className="info-text">This will only take a moment.</p>
          </>
        );
      case "success":
        return (
          <>
            <p className="page-subtitle">{message}</p>
            <Link to="/login" className="primary-button">
              Continue to sign in
            </Link>
          </>
        );
      case "error":
        return (
          <>
            <p className="form-error">{message}</p>
            <p className="info-text">
              Need a new link? Register again with your email to receive another
              verification message.
            </p>
            <div>
              <Link to="/login" className="ghost-button">
                Return to sign in
              </Link>
              <Link to="/register" className="primary-button">
                Register again
              </Link>
            </div>
          </>
        );
      case "missing":
      default:
        return (
          <>
            <p className="form-error">{message}</p>
            <p className="info-text">
              Double-check the link in your email or start a new registration to
              receive a fresh one.
            </p>
            <Link to="/register" className="primary-button">
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
    <div className="auth-page">
      <h1>{heading}</h1>
      {renderContent()}
    </div>
  );
}

export default VerifyEmailPage;
