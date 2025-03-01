import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/imherelogo-transparent.png";

const SideNav = ({ activePage, setActivePage, handleLogout, confirmLogout, setConfirmLogout }) => {
  const navigate = useNavigate();
  const sideNavRef = useRef(null); // ✅ Reference for detecting clicks outside

  // ✅ Detect clicks outside the sidebar to reset `confirmLogout`
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sideNavRef.current && !sideNavRef.current.contains(event.target)) {
        setConfirmLogout(false); // Reset confirm logout when clicking outside
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setConfirmLogout]);

  const handleNavigation = (page) => {
    setActivePage(page);
    if (page === "dashboard") {
      navigate("/attendeehome");
    } else if (page === "settings") {
      navigate("/settings");
    }
  };

  return (
    <aside className="sidebar" ref={sideNavRef}> {/* ✅ Attach ref to sidebar */}
      <img src={Logo} alt="Logo" className="logo" onClick={() => handleNavigation("dashboard")} />
      <h2 className="sidebar-title">My Dashboard</h2>

      <nav>
        <ul>
          <li className={activePage === "dashboard" ? "active" : ""} onClick={() => handleNavigation("dashboard")}>
            Dashboard
          </li>
          <li className={activePage === "settings" ? "active" : ""} onClick={() => handleNavigation("settings")}>
            Settings
          </li>
          <li className="logout" onClick={handleLogout}>
            {confirmLogout ? "Confirm Logout?" : "Logout"}
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default SideNav;
