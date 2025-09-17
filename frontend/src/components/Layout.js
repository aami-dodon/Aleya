import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  captionTextClasses,
  largeHeadingClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  subtleButtonClasses,
  iconButtonClasses,
} from "../styles/ui";

const roleNavigation = {
  journaler: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/journal/history", label: "Journal" },
    { to: "/mentorship", label: "Mentorship" },
    { to: "/settings", label: "Settings" },
  ],
  mentor: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/mentorship", label: "Mentees" },
    { to: "/forms", label: "Forms" },
    { to: "/settings", label: "Settings" },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/forms", label: "Forms" },
    { to: "/mentorship", label: "Mentors" },
    { to: "/settings", label: "Settings" },
  ],
};

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user ? roleNavigation[user.role] || [] : [];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const AuthControls = ({ orientation = "horizontal", onNavigate }) => {
    if (user) {
      const containerClasses =
        orientation === "vertical"
          ? "flex flex-col gap-3"
          : "flex items-center gap-4";
      const textAlignment = orientation === "vertical" ? "text-left" : "text-right";
      const buttonClasses =
        orientation === "vertical"
          ? `${secondaryButtonClasses} w-full px-5 py-2.5 text-sm`
          : `${secondaryButtonClasses} px-5 py-2.5 text-sm`;

      const handleLogoutClick = () => {
        handleLogout();
        if (orientation === "vertical") {
          onNavigate?.();
        }
      };

      return (
        <div className={containerClasses}>
          <div className={textAlignment}>
            <span className={`block ${bodySmallStrongTextClasses} text-emerald-900`}>
              {user.name}
            </span>
            <span className={`${captionTextClasses} text-emerald-900/60`}>{user.role}</span>
          </div>
          <button type="button" className={buttonClasses} onClick={handleLogoutClick}>
            Log out
          </button>
        </div>
      );
    }

    const containerClasses =
      orientation === "vertical"
        ? "flex flex-col gap-3"
        : "flex flex-wrap items-center gap-3";

    const signInClasses =
      orientation === "vertical"
        ? `${subtleButtonClasses} w-full justify-center px-4 py-2`
        : `${subtleButtonClasses} px-4 py-2`;

    const joinClasses =
      orientation === "vertical"
        ? `${primaryButtonClasses} w-full justify-center px-5 py-2.5 text-sm`
        : `${primaryButtonClasses} px-5 py-2.5 text-sm`;

    const handleNavigate = () => {
      if (orientation === "vertical") {
        onNavigate?.();
      }
    };

    return (
      <div className={containerClasses}>
        <NavLink to="/login" className={signInClasses} onClick={handleNavigate}>
          Sign in
        </NavLink>
        <NavLink to="/register" className={joinClasses} onClick={handleNavigate}>
          Join Aleya
        </NavLink>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-950">
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`rounded-full border border-transparent bg-transparent leading-none tracking-tight text-emerald-700 transition hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${largeHeadingClasses}`}
              onClick={() => navigate(user ? "/dashboard" : "/")}
            >
              Aleya
            </button>
            <nav
              className={`hidden flex-1 items-center justify-center gap-2 md:flex ${bodySmallStrongTextClasses} text-emerald-900/70`}
            >
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 transition ${
                      isActive
                        ? "bg-emerald-100 text-emerald-800 shadow-inner shadow-emerald-900/10"
                        : "text-emerald-900/70 hover:bg-emerald-50 hover:text-emerald-700"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="hidden md:block">
              <AuthControls />
            </div>
            <div className="ml-auto flex items-center gap-3 md:hidden">
              <button
                type="button"
                className={`${iconButtonClasses} ${
                  isMobileMenuOpen ? "bg-emerald-600 text-white hover:text-white" : ""
                }`}
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                <span className="sr-only">
                  {isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                </span>
                {isMobileMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className="mt-4 flex flex-col gap-4 md:hidden" id="mobile-navigation">
              {links.length > 0 && (
                <nav
                  className={`flex flex-col gap-2 ${bodySmallStrongTextClasses} text-emerald-900/80`}
                >
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `rounded-full px-4 py-2 transition ${
                          isActive
                            ? "bg-emerald-100 text-emerald-800 shadow-inner shadow-emerald-900/10"
                            : "text-emerald-900/70 hover:bg-emerald-50 hover:text-emerald-700"
                        }`
                      }
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </nav>
              )}
              <AuthControls orientation="vertical" onNavigate={closeMobileMenu} />
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-emerald-100 bg-white/70">
        <div
          className={`mx-auto w-full max-w-6xl px-6 py-6 text-center ${bodySmallMutedTextClasses} text-emerald-900/70`}
        >
          Root your days in care, grow with guidance, and share the harvest.
        </div>
      </footer>
    </div>
  );
}

export default Layout;
