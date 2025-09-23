import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PanicButton from "./PanicButton";
import {
  appBrandClasses,
  appFooterClasses,
  appFooterContentClasses,
  appHeaderClasses,
  appHeaderInnerClasses,
  appHeaderRowClasses,
  appMainClasses,
  appShellClasses,
  authControlsClasses,
  authControlsNameClasses,
  authControlsRoleClasses,
  authControlsTextClasses,
  authControlsTextVerticalClasses,
  authControlsVerticalClasses,
  buttonBlockClasses,
  buttonPadSmClasses,
  buttonPadXsClasses,
  headerActionsClasses,
  iconButtonClasses,
  iconSmallClasses,
  mobileActionsClasses,
  mobileActionsToggleActiveClasses,
  mobileMenuClasses,
  mobileMenuDividerClasses,
  mobileMenuPanelClasses,
  mobileNavClasses,
  mobileNavLinkActiveClasses,
  mobileNavLinkClasses,
  mobileNavLinkInactiveClasses,
  primaryButtonClasses,
  primaryNavClasses,
  primaryNavLinkActiveClasses,
  primaryNavLinkClasses,
  primaryNavLinkInactiveClasses,
  secondaryButtonClasses,
  srOnlyClasses,
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
    { to: "/journalers", label: "Journaler" },
    { to: "/journals", label: "Journals" },
    { to: "/mentorship", label: "Mentors" },
    { to: "/forms", label: "Forms" },
    { to: "/settings", label: "Settings" },
  ],
};

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const commonLinks = [{ to: "/contact", label: "Contact" }];
  const links = [
    ...(user ? roleNavigation[user.role] || [] : []),
    ...commonLinks,
  ];
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
          ? authControlsVerticalClasses
          : authControlsClasses;
      const textClasses =
        orientation === "vertical"
          ? authControlsTextVerticalClasses
          : authControlsTextClasses;
      const buttonClasses =
        orientation === "vertical"
          ? `${secondaryButtonClasses} ${buttonPadSmClasses} ${buttonBlockClasses}`
          : `${secondaryButtonClasses} ${buttonPadSmClasses}`;

      const handleLogoutClick = () => {
        handleLogout();
        if (orientation === "vertical") {
          onNavigate?.();
        }
      };

      return (
        <div className={containerClasses}>
          <div className={textClasses}>
            <span className={authControlsNameClasses}>{user.name}</span>
            <span className={authControlsRoleClasses}>{user.role}</span>
          </div>
          <button type="button" className={buttonClasses} onClick={handleLogoutClick}>
            Log out
          </button>
        </div>
      );
    }

    const containerClasses =
      orientation === "vertical"
        ? authControlsVerticalClasses
        : authControlsClasses;

    const signInClasses =
      orientation === "vertical"
        ? `${subtleButtonClasses} ${buttonPadXsClasses} ${buttonBlockClasses}`
        : `${subtleButtonClasses} ${buttonPadXsClasses}`;

    const joinClasses =
      orientation === "vertical"
        ? `${primaryButtonClasses} ${buttonPadSmClasses} ${buttonBlockClasses}`
        : `${primaryButtonClasses} ${buttonPadSmClasses}`;

    const handleNavigate = () => {
      if (orientation === "vertical") {
        onNavigate?.();
      }
    };

    return (
      <div className={containerClasses}>
        <NavLink to="/login" className={signInClasses} onClick={handleNavigate}>
          Step inside
        </NavLink>
        <NavLink to="/register" className={joinClasses} onClick={handleNavigate}>
          Join the Aleya canopy
        </NavLink>
      </div>
    );
  };

  return (
    <div className={appShellClasses}>
      <header className={appHeaderClasses}>
        <div className={appHeaderInnerClasses}>
          <div className={appHeaderRowClasses}>
            <button
              type="button"
              className={appBrandClasses}
              onClick={() => navigate(user ? "/dashboard" : "/")}
            >
              Aleya
            </button>
            <nav
              className={primaryNavClasses}
            >
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `${primaryNavLinkClasses} ${
                      isActive
                        ? primaryNavLinkActiveClasses
                        : primaryNavLinkInactiveClasses
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className={headerActionsClasses}>
              <PanicButton />
              <AuthControls />
            </div>
            <div className={mobileActionsClasses}>
              <PanicButton />
              <button
                type="button"
                className={`${iconButtonClasses} ${
                  isMobileMenuOpen ? mobileActionsToggleActiveClasses : ""
                }`.trim()}
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                <span className={srOnlyClasses}>
                  {isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                </span>
                {isMobileMenuOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={iconSmallClasses}
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
                    className={iconSmallClasses}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className={mobileMenuClasses} id="mobile-navigation">
              <div className={mobileMenuPanelClasses}>
                {links.length > 0 && (
                  <nav
                    className={mobileNavClasses}
                  >
                    {links.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                          `${mobileNavLinkClasses} ${
                            isActive
                              ? mobileNavLinkActiveClasses
                              : mobileNavLinkInactiveClasses
                          }`
                        }
                        onClick={closeMobileMenu}
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </nav>
                )}
                <div className={mobileMenuDividerClasses}>
                  <AuthControls orientation="vertical" onNavigate={closeMobileMenu} />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      <main className={appMainClasses}>
        {children}
      </main>
      <footer className={appFooterClasses}>
        <div className={appFooterContentClasses}>
          Tend your breath, follow the light, and share the harvest of your days.
        </div>
      </footer>
    </div>
  );
}

export default Layout;
