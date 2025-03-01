import React from "react";
import { useNavigate } from "react-router-dom";
import "./SideNav.css"; // Style file for SideNav
import Logo from "../assets/imherelogo-transparent.png";
import { signOut } from "firebase/auth"; // Import sign-out function
import { auth } from "../firebase/firebase"; // Firebase instance

const SideNav = ({ groupName }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      navigate("/"); // Redirect to login
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <aside className="sidebar">
      <img src={Logo} alt="Logo" className="logo" onClick={() => navigate("/")} />
      <h2 className="sidebar-title">{groupName || "Group Dashboard"}</h2>

      <nav>
        <ul>
          <li onClick={() => navigate("/organizerhome")}>🏠 Organizer Home</li>
          <li onClick={() => navigate("/settings")}>⚙ Settings</li>
          <li className="logout" onClick={handleLogout}>🚪 Logout</li> {/* ✅ Always logs out */}
        </ul>
      </nav>
    </aside>
  );
};

export default SideNav;
