import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/imherelogo-transparent.png";
import "./SideNav.css";
import { auth, db } from "../firebase/firebase"; // Firebase Auth & Firestore
import { doc, getDoc } from "firebase/firestore"; // Firestore methods

const SideNav = ({ activePage, setActivePage, handleLogout, confirmLogout, setConfirmLogout }) => {
  const navigate = useNavigate();
  const sideNavRef = useRef(null);
  const [userRole, setUserRole] = useState(null); // State to store user role

  useEffect(() => {
    // Function to check if user is in "teachers" or "users" collection
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const teacherDocRef = doc(db, "teachers", user.uid);
        const userDocRef = doc(db, "users", user.uid);

        const teacherSnap = await getDoc(teacherDocRef);
        const userSnap = await getDoc(userDocRef);

        if (teacherSnap.exists()) {
          setUserRole("organizer");
        } else if (userSnap.exists()) {
          setUserRole("attendee");
        } else {
          setUserRole(null); // If user is in neither collection
        }
      }
    };

    checkUserRole();

    // Click outside listener for logout confirmation
    const handleClickOutside = (event) => {
      if (sideNavRef.current && !sideNavRef.current.contains(event.target)) {
        setConfirmLogout(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setConfirmLogout]);

  // Handle navigation based on user role
  const handleNavigation = (page) => {
    setActivePage(page);

    if (page === "dashboard") {
      if (userRole === "organizer") {
        navigate("/organizerhome"); // Redirect organizer
      } else {
        navigate("/attendeehome"); // Redirect attendee
      }
    } else {
      navigate("/settings");
    }
  };

  return (
    <aside className="sidebar" ref={sideNavRef}>
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
