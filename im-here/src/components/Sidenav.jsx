import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/imherelogo-transparent.png";
import { FiLogOut, FiHome, FiSettings } from "react-icons/fi";
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
    <aside
      ref={sideNavRef}
      style={{
        width: "90px",
        background: "linear-gradient(180deg, #2c3e50 80%, #34495e 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 0 1.5rem 0",
        boxShadow: "2px 0 16px rgba(44,62,80,0.07)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <img
        src={Logo}
        alt="Logo"
        style={{
          width: "48px",
          height: "48px",
          marginBottom: "2.5rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(44,62,80,0.12)",
          background: "#fff",
          padding: "6px",
          cursor: "pointer",
        }}
        onClick={() => handleNavigation("dashboard")}
      />
      <nav style={{ flex: 1, width: "100%" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%" }}>
          <li style={{ width: "100%" }}>
            <button
              onClick={() => handleNavigation("dashboard")}
              style={{
                width: "100%",
                background: activePage === "dashboard" ? "#fff" : "transparent",
                color: activePage === "dashboard" ? "#2c3e50" : "#ecf0f1",
                border: "none",
                outline: "none",
                padding: "1.2rem 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "12px 0 0 12px",
                marginBottom: "0.5rem",
                boxShadow: activePage === "dashboard" ? "2px 0 12px rgba(44,62,80,0.08)" : "none",
                transition: "background 0.18s, color 0.18s",
              }}
            >
              <FiHome size={22} />
              <span style={{ fontSize: "0.85rem", marginTop: "0.4rem", letterSpacing: "0.5px" }}>
                Dashboard
              </span>
            </button>
          </li>
          <li style={{ width: "100%" }}>
            <button
              onClick={() => handleNavigation("settings")}
              style={{
                width: "100%",
                background: activePage === "settings" ? "#fff" : "transparent",
                color: activePage === "settings" ? "#2c3e50" : "#ecf0f1",
                border: "none",
                outline: "none",
                padding: "1.2rem 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "12px 0 0 12px",
                marginBottom: "0.5rem",
                boxShadow: activePage === "settings" ? "2px 0 12px rgba(44,62,80,0.08)" : "none",
                transition: "background 0.18s, color 0.18s",
              }}
            >
              <FiSettings size={22} />
              <span style={{ fontSize: "0.85rem", marginTop: "0.4rem", letterSpacing: "0.5px" }}>
                Settings
              </span>
            </button>
          </li>
        </ul>
      </nav>
      <div style={{ width: "100%" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: "#e74c3c",
            color: "#fff",
            border: "none",
            outline: "none",
            padding: "1.1rem 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: "12px 0 0 12px",
            marginBottom: "0.5rem",
            boxShadow: "0 2px 8px rgba(231,76,60,0.10)",
            transition: "background 0.18s",
          }}
          onMouseEnter={e => (e.target.style.background = "#c0392b")}
          onMouseLeave={e => (e.target.style.background = "#e74c3c")}
        >
          <FiLogOut size={22} />
          <span style={{ fontSize: "0.85rem", marginTop: "0.4rem", letterSpacing: "0.5px" }}>
            Logout
          </span>
        </button>
        {confirmLogout && (
          <div
            style={{
              position: "absolute",
              bottom: "90px",
              left: "100%",
              background: "#fff",
              color: "#2c3e50",
              borderRadius: "10px",
              boxShadow: "0 2px 12px rgba(44,62,80,0.13)",
              padding: "1.2rem 1.5rem",
              zIndex: 10,
              minWidth: "220px",
              marginLeft: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, marginBottom: "1rem" }}>Confirm logout?</span>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleLogout}
                style={{
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 1.2rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                style={{
                  background: "#ecf0f1",
                  color: "#2c3e50",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 1.2rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SideNav;
