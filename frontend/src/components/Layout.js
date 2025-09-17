import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  primaryButtonClasses,
  secondaryButtonClasses,
  subtleButtonClasses,
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-950">
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            className="rounded-full border border-transparent bg-transparent text-2xl font-bold text-emerald-700 transition hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            onClick={() => navigate(user ? "/dashboard" : "/")}
          >
            Aleya
          </button>
          <nav className="flex flex-1 flex-wrap items-center justify-center gap-2 text-sm font-semibold text-emerald-900/70">
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
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-right">
                  <span className="block text-sm font-semibold text-emerald-900">
                    {user.name}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-emerald-900/60">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  className={`${secondaryButtonClasses} px-5 py-2.5 text-sm`}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <NavLink to="/login" className={`${subtleButtonClasses} px-4 py-2`}>
                  Sign in
                </NavLink>
                <NavLink
                  to="/register"
                  className={`${primaryButtonClasses} px-5 py-2.5 text-sm`}
                >
                  Join Aleya
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
        {children}
      </main>
      <footer className="border-t border-emerald-100 bg-white/70">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-sm text-emerald-900/70">
          Root your days in care, grow with guidance, and share the harvest.
        </div>
      </footer>
    </div>
  );
}

export default Layout;
