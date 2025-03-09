import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideNav from "./SideNav";
import "./GroupPage.css"; // Uses GroupPage CSS for styling
import { auth, db } from "../firebase/firebase";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { leaveGroup, fetchUserGroups } from "../firebase/firebaseGroups";
import { signOut } from "firebase/auth";

const AttendeeGroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  // Page state and tab state – default active tab is "upcoming"
  const [activePage, setActivePage] = useState("group");
  // Tabs: "active", "upcoming", "history", "settings"
  const [activeTab, setActiveTab] = useState("upcoming");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [groups, setGroups] = useState([]);

  // Session states
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  // New state for active class session (if any)
  const [activeSession, setActiveSession] = useState(null);
  // State to track if the student has joined the active class
  const [hasJoinedActive, setHasJoinedActive] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

  // Set up a real‑time listener on the entire classHistory collection for this group.
  // This listener updates upcomingSessions, pastSessions, and activeSession in real time.
  useEffect(() => {
    const classRef = collection(db, "groups", group.id, "classHistory");
    const unsubscribe = onSnapshot(classRef, (snapshot) => {
      let sessions = [];
      snapshot.forEach((docSnap) => {
        sessions.push({ id: docSnap.id, ...docSnap.data() });
      });
      const today = new Date();
      // Upcoming: sessions with date >= today, not live, and not ended.
      const upcoming = sessions.filter(
        (session) =>
          new Date(session.date) >= today && !session.ended && !session.isLive
      );
      // Past: sessions with date < today OR with ended === true.
      const past = sessions.filter(
        (session) => new Date(session.date) < today || session.ended === true
      );
      // Active session: any session where isLive === true.
      const active = sessions.find((session) => session.isLive === true) || null;
      setUpcomingSessions(upcoming);
      setPastSessions(past);
      setActiveSession(active);
    });
    return () => unsubscribe();
  }, [group]);

  // Function to join the active class
  const handleJoinClass = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to join a class.");
      return;
    }
    if (!activeSession) {
      alert("No active class to join.");
      return;
    }
    try {
      const sessionRef = doc(db, "groups", group.id, "classHistory", activeSession.id);
      const attendanceRecord = { id: user.uid, joined: new Date().toISOString() };
      await updateDoc(sessionRef, {
        attendees: arrayUnion(attendanceRecord)
      });
      alert("Class joined successfully.");
      setHasJoinedActive(true);
      // The real-time listener will update activeSession automatically.
    } catch (error) {
      console.error("❌ Error joining class:", error);
      alert("Failed to join class.");
    }
  };

  // Function to leave the active class
  const handleLeaveClass = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to leave a class.");
      return;
    }
    if (!activeSession) {
      alert("No active class to leave.");
      return;
    }
    try {
      const sessionRef = doc(db, "groups", group.id, "classHistory", activeSession.id);
      const updatedAttendees = (activeSession.attendees || []).filter(
        (att) => att.id !== user.uid
      );
      await updateDoc(sessionRef, { attendees: updatedAttendees });
      alert("You have left the class.");
      setHasJoinedActive(false);
      // The real-time listener will update activeSession accordingly.
    } catch (error) {
      console.error("❌ Error leaving class:", error);
      alert("Failed to leave class.");
    }
  };

  // Logout function
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

  // For generic session click (if needed)
  const handleSessionClick = (session) => {
    console.log("Session clicked:", session);
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
          <strong>📅 Meeting Days:</strong>{" "}
          {Array.isArray(group.meetingDays) && group.meetingDays.length > 0
            ? group.meetingDays.join(", ")
            : "No days selected"}{" "}
          at {group.meetingTime || "No time set"}
        </p>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "2rem" }}>
          <strong>👤 Organizer:</strong> {group.organizerName || "Unknown Organizer"}
        </p>

        {/* Tab Menu */}
        <div className="tab-menu">
          <button className={activeTab === "active" ? "active" : ""} onClick={() => setActiveTab("active")}>
            Active Class
          </button>
          <button className={activeTab === "upcoming" ? "active" : ""} onClick={() => setActiveTab("upcoming")}>
            Upcoming Classes
          </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
            📜 History
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            ⚙ Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content" style={{ marginBottom: "2rem" }}>
          {activeTab === "active" && (
            <div>
              <h3>Active Class</h3>
              {activeSession ? (
                <div>
                  <p>
                    <strong>Class:</strong>{" "}
                    {activeSession.className ? activeSession.className : activeSession.date}
                  </p>
                  <h4>Attendees Checked In:</h4>
                  {activeSession.attendees && activeSession.attendees.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {activeSession.attendees.map((att) => (
                        <li key={att.id}>
                          {att.id} - Joined at {att.joined} {att.left && `| Left at ${att.left}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No attendees have checked in yet.</p>
                  )}
                  {!hasJoinedActive ? (
                    <button className="button primary" onClick={handleJoinClass} style={{ marginTop: "1rem" }}>
                      Join Class
                    </button>
                  ) : (
                    <button className="button danger" onClick={handleLeaveClass} style={{ marginTop: "1rem" }}>
                      Leave Class
                    </button>
                  )}
                </div>
              ) : (
                <p>No active class at the moment.</p>
              )}
            </div>
          )}
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
                pastSessions.map((session) => (
                  <div key={session.id} className="session-item" style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}>
                    <p>
                      <strong>{session.date}</strong>
                    </p>
                    {session.attendees && session.attendees.length > 0 && (
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {session.attendees.map((att) => (
                          <li key={att.id}>
                            {att.id} - Joined: {att.joined}
                            {att.left ? `, Left: ${att.left}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p>No past classes available.</p>
              )}
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h3>Settings</h3>
              <p>Settings content goes here.</p>
              <button
                className="button danger remove-student"
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  alert("Leave Group functionality not implemented here.");
                }}
                disabled={leaving}
              >
                {leaving ? "Leaving..." : "❌ Leave Group"}
              </button>
            </div>
          )}
        </div>

        <div className="button-container">
          <button className="button back-button" onClick={() => navigate("/attendeehome")}>
            ⬅ Back to Attendee Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default AttendeeGroupPage;
