import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideNav from "./SideNav";
import "./GroupPage.css"; // ✅ Uses GroupPage CSS
import { auth, db } from "../firebase/firebase";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";

const AttendeeGroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  const [checkingIn, setCheckingIn] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [activePage, setActivePage] = useState("group");
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!group) {
    return (
      <div className="group-page">
        <p>No group data found. <a href="/attendeehome">⬅ Go Back</a></p>
      </div>
    );
  }

  const handleCheckIn = async () => {
    setCheckingIn(true);
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to check in.");
      setCheckingIn(false);
      return;
    }

    try {
      const sessionRef = doc(db, "groups", group.id, "classHistory", new Date().toISOString());
      await updateDoc(sessionRef, {
        [`attendees.${user.uid}`]: true,
      });

      alert(`✅ Checked in for ${group.groupName}`);
    } catch (error) {
      console.error("❌ Error checking in:", error);
      alert("Failed to check in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleLeaveGroup = async () => {
    setLeaving(true);
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to leave a group.");
      setLeaving(false);
      return;
    }

    try {
      const groupRef = doc(db, "groups", group.id);
      const userRef = doc(db, "users", user.uid);

      await updateDoc(groupRef, {
        attendees: arrayRemove({
          id: user.uid,
          name: user.displayName,
          email: user.email,
        }),
      });

      await updateDoc(userRef, {
        groups: arrayRemove({
          groupId: group.id,
          groupName: group.groupName,
          organizer: group.organizerName,
        }),
      });

      alert(`❌ Left group: ${group.groupName}`);
      navigate("/attendeehome");
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      alert("Failed to leave group.");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f4f4" }}>
      <SideNav activePage={activePage} setActivePage={setActivePage} handleLogout={() => setConfirmLogout(true)} confirmLogout={confirmLogout} setConfirmLogout={setConfirmLogout} />

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "3rem 2.5rem", backgroundColor: "#ecf0f1" }}>
        <h1 style={{ marginBottom: "2.5rem", fontSize: "2.5rem", color: "#333" }}>{group.groupName}</h1>

        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "1rem" }}>
          <strong>📍 Location:</strong> {group.location || "No location set"}
        </p>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "1rem" }}>
          <strong>📅 Meeting Days:</strong> {Array.isArray(group.meetingDays) && group.meetingDays.length > 0 ? group.meetingDays.join(", ") : "No days selected"} at {group.meetingTime || "No time set"}
        </p>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "2rem" }}>
          <strong>👤 Organizer:</strong> {group.organizerName || "Unknown Organizer"}
        </p>

        {/* ACTION BUTTONS */}
        <div style={{ marginTop: "2.5rem", display: "flex", gap: "1.5rem" }}>
          <button 
            style={{ 
              padding: "1rem 2rem", 
              fontSize: "1.2rem", 
              backgroundColor: "#3498db", 
              color: "#fff", 
              cursor: "pointer", 
              borderRadius: "6px", 
              border: "none" 
            }} 
            onClick={handleCheckIn} 
            disabled={checkingIn}
          >
            {checkingIn ? "Checking in..." : "✅ Check In"}
          </button>
          <button 
            style={{ 
              padding: "1rem 2rem", 
              fontSize: "1.2rem", 
              backgroundColor: "#3498db", 
              color: "#fff", 
              cursor: "pointer", 
              borderRadius: "6px", 
              border: "none" 
            }} 
            onClick={handleLeaveGroup} 
            disabled={leaving}
          >
            {leaving ? "Leaving..." : "❌ Leave Group"}
          </button>
        </div>

        {/* BACK BUTTON */}
        <button 
          style={{ 
            marginTop: "2rem", 
            padding: "1rem 2rem", 
            fontSize: "1.2rem", 
            backgroundColor: "#3498db", 
            color: "#fff", 
            cursor: "pointer", 
            borderRadius: "6px", 
            border: "none" 
          }} 
          onClick={() => navigate("/attendeehome")}
        >
          ⬅ Back to Attendee Home
        </button>
      </main>

    </div>
  );
};

export default AttendeeGroupPage;
