import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GroupPage.css"; // ✅ Uses GroupPage CSS
import SideNav from "../components/SideNav"; // ✅ Unmodified SideNav
import { auth, db } from "../firebase/firebase";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";

const AttendeeGroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  const [checkingIn, setCheckingIn] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (!group) {
    return (
      <div className="group-page">
        <p>No group data found. <a href="/attendeehome">⬅ Go Back</a></p>
      </div>
    );
  }

  // ✅ Handle Check-in
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
        [`attendees.${user.uid}`]: true, // ✅ Mark user as present
      });

      alert(`✅ Checked in for ${group.groupName}`);
    } catch (error) {
      console.error("❌ Error checking in:", error);
      alert("Failed to check in.");
    } finally {
      setCheckingIn(false);
    }
  };

  // ✅ Handle Leave Group
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

      // ✅ Remove user from group attendees
      await updateDoc(groupRef, {
        attendees: arrayRemove({
          id: user.uid,
          name: user.displayName,
          email: user.email,
        }),
      });

      // ✅ Remove group from user profile
      await updateDoc(userRef, {
        groups: arrayRemove({
          groupId: group.id,
          groupName: group.groupName,
          organizer: group.organizerName,
        }),
      });

      alert(`❌ Left group: ${group.groupName}`);
      navigate("/attendeehome"); // ✅ Redirect back to home
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      alert("Failed to leave group.");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="group-page">
      {/* ✅ Side Navigation (unchanged) */}
      <SideNav groupName={group.groupName} />

      {/* ✅ Main Content */}
      <main className="group-content">
        <h1>{group.groupName}</h1>
        <p>📍 {group.location || "No location set"}</p>
        <p>📅 {Array.isArray(group.meetingDays) && group.meetingDays.length > 0 ? group.meetingDays.join(", ") : "No days selected"} at {group.meetingTime || "No time set"}</p>
        <p>👤 Organizer: {group.organizerName || "Unknown Organizer"}</p>

        {/* ✅ Back Button */}
        <button className="button back-button" onClick={() => navigate("/attendeehome")}>
          ⬅ Back to Attendee Home
        </button>

        {/* ✅ Action Buttons */}
        <div className="group-actions">
          <button 
            className="button primary" 
            onClick={handleCheckIn} 
            disabled={checkingIn}
          >
            {checkingIn ? "Checking in..." : "✅ Check In"}
          </button>

          <button 
            className="button danger" 
            onClick={handleLeaveGroup} 
            disabled={leaving}
          >
            {leaving ? "Leaving..." : "❌ Leave Group"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AttendeeGroupPage;
