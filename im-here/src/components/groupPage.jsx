import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideNav from "../components/SideNav";
import "./GroupPage.css"; // Uses GroupPage CSS for styling
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, collection, getDocs, updateDoc, setDoc } from "firebase/firestore";
import { fetchOrganizerGroups, leaveGroup } from "../firebase/firebaseGroups";
import { signOut } from "firebase/auth";

const OrganizerGroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  // Page and tab states – default active tab is "upcoming"
  const [activePage, setActivePage] = useState("group");
  // Active tab options: "active", "upcoming", "student", "history", "settings"
  const [activeTab, setActiveTab] = useState("upcoming");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Data for tabs
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [attendeeDetails, setAttendeeDetails] = useState([]);
  // New state for the active class session
  const [activeSession, setActiveSession] = useState(null);

  // Modal state for starting a class
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Unique cache keys for sessions (based on group ID)
  const upcomingKey = group ? `upcoming_${group.id}` : "upcoming";
  const pastKey = group ? `past_${group.id}` : "past";

  // Fetch attendee details (for the Students tab)
  useEffect(() => {
    const fetchAttendees = async () => {
      if (!group?.id) return;
      try {
        const groupRef = doc(db, "groups", group.id);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          const attendeeIds = groupData.attendees || [];
          const attendeePromises = attendeeIds.map((uid) =>
            getDoc(doc(db, "users", uid)).then((snap) =>
              snap.exists() ? { id: uid, ...snap.data() } : null
            )
          );
          const attendees = (await Promise.all(attendeePromises)).filter(
            (u) => u !== null
          );
          setAttendeeDetails(attendees);
        }
      } catch (error) {
        console.error("❌ Error fetching attendees:", error);
      }
    };
    fetchAttendees();
  }, [group]);

  // Fetch sessions from Firestore, split them into upcoming and past, and cache them
  const fetchSessions = async () => {
    if (!group?.id) return;
    try {
      const classRef = collection(db, "groups", group.id, "classHistory");
      const classSnap = await getDocs(classRef);
      let sessions = [];
      classSnap.forEach((docSnap) => {
        sessions.push({ id: docSnap.id, ...docSnap.data() });
      });
      const today = new Date();
      // Upcoming sessions: date in future and not ended
      const upcoming = sessions.filter(
        (session) => new Date(session.date) >= today && !session.ended
      );
      // History sessions: date in past or explicitly ended
      const past = sessions.filter(
        (session) => new Date(session.date) < today || session.ended === true
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
  
  // When activeTab is "upcoming" or "history", load sessions from cache or fetch them
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

  // When an upcoming session is clicked, open the modal to start class
  const handleUpcomingSessionClick = (session) => {
    setSelectedSession(session);
    setShowStartModal(true);
  };

  // Modal close function
  const closeModal = () => {
    setShowStartModal(false);
    setSelectedSession(null);
  };

  // Handle Start Class in modal (no date check now)
  const handleStartClass = async () => {
    if (!selectedSession) return;
    try {
      const sessionRef = doc(db, "groups", group.id, "classHistory", selectedSession.id);
      // Update the session document to mark it as live
      await updateDoc(sessionRef, { isLive: true });
      alert("Class has been started and is now live.");
      // Set activeSession state so that Active Class tab can show it
      setActiveSession({ ...selectedSession, isLive: true });
      // Remove the session from upcomingSessions since it's now active
      setUpcomingSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      // Switch to the Active Class tab
      setActiveTab("active");
      closeModal();
    } catch (error) {
      console.error("❌ Error starting class:", error);
      alert("Failed to start class.");
    }
  };

  // Handle End Class button in Active Class tab
  const handleEndClass = async () => {
    if (!activeSession) return;
    try {
      const sessionRef = doc(db, "groups", group.id, "classHistory", activeSession.id);
      // Update the session to mark it as ended (and not live)
      await updateDoc(sessionRef, { isLive: false, ended: true });
      alert("Class has ended.");
      // Clear activeSession and refresh sessions
      setActiveSession(null);
      await fetchSessions();
      setActiveTab("history");
    } catch (error) {
      console.error("❌ Error ending class:", error);
      alert("Failed to end class.");
    }
  };
  

  // Logout function for SideNav
  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
    } else {
      try {
        await signOut(auth);
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  if (!group) {
    return (
      <div className="group-page">
        <p>No group data found. <a href="/organizerhome">⬅ Go Back</a></p>
      </div>
    );
  }

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

        {/* Tab Menu using CSS classes */}
        <div className="tab-menu">
          <button className={activeTab === "active" ? "active" : ""} onClick={() => setActiveTab("active")}>
            Active Class
          </button>
          <button className={activeTab === "upcoming" ? "active" : ""} onClick={() => setActiveTab("upcoming")}>
            Upcoming Classes
          </button>
          <button className={activeTab === "student" ? "active" : ""} onClick={() => setActiveTab("student")}>
            📋 Students
          </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
            📜 History
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            ⚙ Group Settings
          </button>
        </div>

        {/* Tab Content using CSS classes */}
        <div className="tab-content" style={{ marginBottom: "2rem" }}>
          {activeTab === "active" && (
            <div>
              <h3>Active Class</h3>
              {activeSession ? (
                <div>
                  <p>
                    <strong>Date:</strong> {activeSession.date}
                  </p>
                  <h4>Attendees Checked In:</h4>
                  {activeSession.attendees && activeSession.attendees.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {activeSession.attendees.map((uid) => (
                        <li key={uid}>{uid}</li> // Replace uid with resolved user info if available
                      ))}
                    </ul>
                  ) : (
                    <p>No attendees have checked in yet.</p>
                  )}
                  {/* End Class button appears only if there's an active session */}
                  <button
                    className="button danger remove-student"
                    style={{ marginTop: "1rem" }}
                    onClick={handleEndClass}
                  >
                    End Class
                  </button>
                </div>
              ) : (
                <p>No active class. View upcoming classes to start a session.</p>
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
                      onClick={() => handleUpcomingSessionClick(session)}
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
          {activeTab === "student" && (
            <div>
              <h3>Student List</h3>
              {attendeeDetails.length > 0 ? (
                <ul className="student-list">
                  {attendeeDetails.map((student) => (
                    <li key={student.id} className="student-item">
                      <strong>{student.fullName}</strong> - {student.email}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No students have joined this group yet.</p>
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
                      onClick={() => console.log("History session clicked", session)}
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
              {/* Leave Group button in Settings */}
              <button
                className="button danger remove-student"
                style={{ marginTop: "1rem" }}
                onClick={handleLeaveGroup}
                disabled={leaving}
              >
                {leaving ? "Leaving..." : "❌ Leave Group"}
              </button>
            </div>
          )}
        </div>

        <div className="button-container">
          <button className="button back-button" onClick={() => navigate("/organizerhome")}>
            ⬅ Back to Organizer Home
          </button>
          <button className="button primary add-student" onClick={() => alert("Add Student functionality here")}>
            ✅ Add Student
          </button>
          <button className="button danger remove-student" onClick={() => alert("Remove Student functionality here")}>
            ❌ Remove Selected Students
          </button>
        </div>
      </main>

      {/* Modal for Starting Class */}
      {showStartModal && selectedSession && (
        <div className="modal">
          <div className="modal-content">
            <h3>Start Class</h3>
            <p>
              <strong>Date:</strong> {selectedSession.date}
            </p>
            <p>
              <strong>Time:</strong> {group.meetingTime || "Not set"}
            </p>
            <div className="modal-buttons">
              <button className="button primary" onClick={handleStartClass}>
                Start Class
              </button>
              <button className="button danger" onClick={closeModal}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerGroupPage;
