import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/imherelogo-transparent.png";
import "./SideNav.css";

const SideNav = ({ activePage, setActivePage, handleLogout, confirmLogout, setConfirmLogout, groups }) => {
  const navigate = useNavigate();
  const sideNavRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sideNavRef.current && !sideNavRef.current.contains(event.target)) {
        setConfirmLogout(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setConfirmLogout]);

  const handleNavigation = (page) => {
    setActivePage(page);
    navigate(page === "dashboard" ? "/attendeehome" : "/settings");
  };

  const handleGroupClick = (group) => {
    navigate("/attendeegrouppage", { state: { group } });
  };

  return (
    <aside className="sidebar" ref={sideNavRef}>
      {/* Logo */}
      <img src={Logo} alt="Logo" className="logo" onClick={() => handleNavigation("dashboard")} />
      <h2 className="sidebar-title">My Dashboard</h2>

      {/* Navigation */}
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

      {/* Group List */}
      
    </aside>
  );
};

export default SideNav;
