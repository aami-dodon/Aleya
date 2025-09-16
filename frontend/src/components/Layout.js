import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    <div className="app-shell">
      <header className="app-header">
        <button
          type="button"
          className="brand"
          onClick={() => navigate(user ? "/dashboard" : "/")}
        >
          Aleya
        </button>
        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <div className="header-profile">
                <span className="profile-name">{user.name}</span>
                <span className="profile-role">{user.role}</span>
              </div>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <div className="auth-links">
              <NavLink to="/login" className="nav-link">
                Sign in
              </NavLink>
              <NavLink to="/register" className="primary-button">
                Join Aleya
              </NavLink>
            </div>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <p>Root your days in care, grow with guidance, and share the harvest.</p>
      </footer>
    </div>
  );
}

export default Layout;
