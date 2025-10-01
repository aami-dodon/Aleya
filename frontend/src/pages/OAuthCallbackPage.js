import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthState } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const bootId = searchParams.get("bootId");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      navigate("/login?error=" + encodeURIComponent("Authentication failed. Please try again."));
      return;
    }

    if (!token) {
      console.error("No token received from OAuth");
      navigate("/login?error=" + encodeURIComponent("Authentication failed. No token received."));
      return;
    }

    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const authData = {
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
        },
        token: token,
        bootId: bootId,
      };

      // Store auth data
      localStorage.setItem("aleya.auth", JSON.stringify(authData));
      
      // Update auth context
      setAuthState({
        user: authData.user,
        token: authData.token,
        loading: false,
        error: null,
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error processing OAuth callback:", error);
      navigate("/login?error=" + encodeURIComponent("Authentication failed. Please try again."));
    }
  }, [searchParams, navigate, setAuthState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center">
      <div className="text-center">
        <LoadingState />
        <p className="mt-4 text-emerald-700">Completing sign in...</p>
      </div>
    </div>
  );
}

export default OAuthCallbackPage;