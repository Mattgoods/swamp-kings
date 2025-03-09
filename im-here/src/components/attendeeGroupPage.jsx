import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideNav from "./SideNav";
import "./GroupPage.css"; // Uses GroupPage CSS for styling
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { leaveGroup, fetchUserGroups } from "../firebase/firebaseGroups";
import { signOut } from "firebase/auth";

const AttendeeGroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  const [checkingIn, setCheckingIn] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [activePage, setActivePage] = useState("group");
  // Active tab: "upcoming", "history", "settings"
  const [activeTab, setActiveTab] = useState("upcoming");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [groups, setGroups] = useState([]);

  // States for class sessions
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  // Fetch user groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      const user = auth.currentUser;
      if (user) {
        const userGroups = await fetchUserGroups(user.uid);
        setGroups(userGroups);
      }
    };
    fetchGroups();
  }, []);

  if (!group || !group.id) {
    return (
      <div className="group-page">
        <p>No group data found. <a href="/attendeehome">⬅ Go Back</a></p>
      </div>
    );
  }

  // Define unique cache keys for sessions based on group ID
  const upcomingKey = `upcoming_${group.id}`;
  const pastKey = `past_${group.id}`;

  // Function to fetch sessions from Firestore, split them, and cache them
  const fetchSessions = async () => {
    try {
      const classRef = collection(db, "groups", group.id, "classHistory");
      const classSnap = await getDocs(classRef);
      let sessions = [];
      classSnap.forEach((docSnap) => {
        sessions.push({ id: docSnap.id, ...docSnap.data() });
      });
      const today = new Date();
      const upcoming = sessions.filter(
        (session) => new Date(session.date) >= today
      );
      const past = sessions.filter(
        (session) => new Date(session.date) < today
      );
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
      past.sort((a, b) => new Date(b.date) - new Date(a.date));
      setUpcomingSessions(upcoming);
      setPastSessions(past);
      sessionStorage.setItem(upcomingKey, JSON.stringify(upcoming));
      sessionStorage.setItem(pastKey, JSON.stringify(past));
    } catch (error) {
      console.error("❌ Error fetching sessions:", error);
    }
  };

  // When activeTab is "upcoming" or "history", check cache or fetch sessions
  useEffect(() => {
    if ((activeTab === "upcoming" || activeTab === "history") && group?.id) {
      const cachedUpcoming = sessionStorage.getItem(upcomingKey);
      const cachedPast = sessionStorage.getItem(pastKey);
      if (cachedUpcoming && cachedPast) {
        setUpcomingSessions(JSON.parse(cachedUpcoming));
        setPastSessions(JSON.parse(cachedPast));
      } else {
        fetchSessions();
      }
    }
  }, [activeTab, group]);

  // Clear session cache when navigating away from the group page
  useEffect(() => {
    if (activePage !== "group" && group?.id) {
      sessionStorage.removeItem(upcomingKey);
      sessionStorage.removeItem(pastKey);
    }
  }, [activePage, group]);

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
      await updateDoc(sessionRef, { [`attendees.${user.uid}`]: true });
      alert(`✅ Checked in for ${group.groupName}`);
    } catch (error) {
      console.error("❌ Error checking in:", error);
      alert("Failed to check in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (leaving) return;
    setLeaving(true);
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to leave a group.");
      setLeaving(false);
      return;
    }
    try {
      await leaveGroup(group.id, user.uid);
      const storedGroups = JSON.parse(sessionStorage.getItem("userGroups")) || [];
      const updatedGroups = storedGroups.filter((g) => g.id !== group.id);
      sessionStorage.setItem("userGroups", JSON.stringify(updatedGroups));
      setGroups(updatedGroups);
      alert(`❌ Left group: ${group.groupName}`);
      navigate("/attendeehome");
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      alert("Failed to leave group.");
    } finally {
      setLeaving(false);
    }
  };

  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
    } else {
      try {
        sessionStorage.clear();
        localStorage.clear();
        await signOut(auth);
        window.location.href = "/login";
      } catch (error) {
        console.error("❌ Logout Error:", error);
      }
    }
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    console.log("Session clicked:", session);
    // Extend this function to show session details or navigate
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f4f4" }}>
      <SideNav 
        activePage={activePage}
        setActivePage={setActivePage}
        handleLogout={handleLogout}
        confirmLogout={confirmLogout}
        setConfirmLogout={setConfirmLogout}
      />

      <main className="group-content" style={{ flex: 1, padding: "3rem 2.5rem", backgroundColor: "#ecf0f1" }}>
        <h1 style={{ marginBottom: "2.5rem", fontSize: "2.5rem", color: "#333" }}>
          {group.groupName}
        </h1>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "1rem" }}>
          <strong>📍 Location:</strong> {group.location || "No location set"}
        </p>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "1rem" }}>
          <strong>📅 Meeting Days:</strong> {Array.isArray(group.meetingDays) && group.meetingDays.length > 0 ? group.meetingDays.join(", ") : "No days selected"} at {group.meetingTime || "No time set"}
        </p>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "2rem" }}>
          <strong>👤 Organizer:</strong> {group.organizerName || "Unknown Organizer"}
        </p>

        {/* Tab Menu using CSS classes */}
        <div className="tab-menu">
          <button
            className={activeTab === "upcoming" ? "active" : ""}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Classes
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            ⚙ Settings
          </button>
        </div>

        {/* Tab Content using CSS classes */}
        <div className="tab-content" style={{ marginBottom: "2rem" }}>
          {activeTab === "upcoming" && (
            <div>
              <h3>Upcoming Classes</h3>
              {upcomingSessions.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {upcomingSessions.map((session) => (
                    <li
                      key={session.id}
                      className="session-item"
                      onClick={() => handleSessionClick(session)}
                      style={{ cursor: "pointer", padding: "0.5rem", borderBottom: "1px solid #ccc" }}
                    >
                      {session.date}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No upcoming classes available.</p>
              )}
            </div>
          )}
          {activeTab === "history" && (
            <div>
              <h3>Class History</h3>
              {pastSessions.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {pastSessions.map((session) => (
                    <li
                      key={session.id}
                      className="session-item"
                      onClick={() => handleSessionClick(session)}
                      style={{ cursor: "pointer", padding: "0.5rem", borderBottom: "1px solid #ccc" }}
                    >
                      {session.date}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No past classes available.</p>
              )}
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h3>Settings</h3>
              <p>Settings content goes here.</p>
            </div>
          )}
        </div>

      

        {/* Check In & Leave Group Buttons */}
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
          <button
            className="button"
            style={{
              backgroundColor: "#3498db",
              color: "#fff",
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={handleCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? "Checking in..." : "✅ Check In"}
          </button>
          <button
            className="button"
            style={{
              backgroundColor: "#e74c3c",
              color: "#fff",
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={handleLeaveGroup}
            disabled={leaving}
          >
            {leaving ? "Leaving..." : "❌ Leave Group"}
          </button>
        </div>

        <button
          className="button"
          style={{
            marginTop: "2rem",
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            backgroundColor: "#3498db",
            color: "#fff",
            cursor: "pointer",
            borderRadius: "6px",
            border: "none",
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
