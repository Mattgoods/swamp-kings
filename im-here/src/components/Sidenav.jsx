import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/imherelogo-transparent.png";
import "./SideNav.css";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/**
 * A unified side‑navigation component that correctly resolves the logged‑in
 * user’s full name whether they are stored in the `teachers` or `users`
 * collection. It waits for Firebase Auth to emit the current user before
 * hitting Firestore, so the name no longer flashes as "Unknown User".
 */
const SideNav = ({
  activePage,
  setActivePage,
  handleLogout,
  confirmLogout,
  setConfirmLogout
}) => {
  const navigate = useNavigate();
  const sideNavRef = useRef(null);

  const [userRole, setUserRole] = useState(null); // "organizer" | "attendee" | null
  const [userName, setUserName] = useState("Loading…");

  // ─── Resolve current user + Firestore profile ─────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserName("Guest");
        setUserRole(null);
        return;
      }

      // Look in `teachers` first (organizers)
      const teacherRef = doc(db, "teachers", user.uid);
      const teacherSnap = await getDoc(teacherRef);
      if (teacherSnap.exists()) {
        setUserRole("organizer");
        setUserName(teacherSnap.data().fullName || "Organizer");
        return;
      }

      // Fallback to `users` collection (attendees)
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserRole("attendee");
        setUserName(userSnap.data().fullName || "Attendee");
      } else {
        setUserRole(null);
        setUserName("Unknown User");
      }
    });

    // Click‑outside handler for dismissing the logout confirmation
    const handleClickOutside = (e) => {
      if (sideNavRef.current && !sideNavRef.current.contains(e.target)) {
        setConfirmLogout(false);
      }
    };
    document.addEventListener("click", handleClickOutside);

    return () => {
      unsubAuth();
      document.removeEventListener("click", handleClickOutside);
    };
  }, [setConfirmLogout]);

  // ─── Navigation helpers ───────────────────────────────────────────────────
  const handleNavigation = (page) => {
    setActivePage(page);
    if (page === "dashboard") {
      navigate(userRole === "organizer" ? "/organizerhome" : "/attendeehome");
    } else {
      navigate("/settings");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <aside className="sidebar" ref={sideNavRef}>
      <img
        src={Logo}
        alt="Logo"
        className="logo"
        onClick={() => handleNavigation("dashboard")}
      />

      <h2 className="sidebar-title">{userName}</h2>

      <nav>
        <ul>
          <li
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => handleNavigation("dashboard")}
          >
            Dashboard
          </li>
          <li
            className={activePage === "settings" ? "active" : ""}
            onClick={() => handleNavigation("settings")}
          >
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
