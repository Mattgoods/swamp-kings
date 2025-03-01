import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/imherelogo-transparent.png";

const SideNav = ({ activePage, setActivePage, handleLogout, confirmLogout }) => {
  const navigate = useNavigate();

  const handleNavigation = (page) => {
    setActivePage(page); // ✅ Set active page
    if (page === "dashboard") {
      navigate("/attendeehome"); // ✅ Ensure the correct path
    } else if (page === "settings") {
      navigate("/settings"); // ✅ Change this to your settings page route
    }
  };

  return (
    <aside className="sidebar">
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
