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

  // Function to fetch latitude and longitude from an address using a geocoding API
  const geocodeAddress = async (address) => {
    const apiKey = "AIzaSyDdFYHNjvrmWaJMfmcwCdofLHziP84rzas"; // Replace with your API key
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lon: location.lng };
      } else {
        console.error("❌ Geocoding failed:", data);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching geocoding data:", error);
      return null;
    }
  };

  // Ensure group location is properly set
  useEffect(() => {
    const fetchGroupCoordinates = async () => {
      if (group && typeof group.location === "string") {
        console.log("Group location (address):", group.location);
        const coordinates = await geocodeAddress(group.location);
        if (coordinates) {
          group.location = coordinates; // Update group location with lat/lon
          console.log("Group location (coordinates):", group.location);
        } else {
          console.warn("Failed to fetch coordinates for group location.");
        }
      } else if (group && group.location) {
        console.log("Group location (coordinates):", group.location);
      } else {
        console.warn("Group location is not set or improperly formatted.");
      }
    };

    fetchGroupCoordinates();
  }, [group]);

  // Debugging: Log the group location to verify its structure
  useEffect(() => {
    if (group && group.location) {
      console.log("Group location:", group.location);
    } else {
      console.warn("Group location is not set or improperly formatted.");
    }
  }, [group]);

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

  // Function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Function to join the active class with location check
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

    // Ensure group location is properly set
    if (!group.location || typeof group.location.lat !== "number" || typeof group.location.lon !== "number") {
      alert("Group location is not set or improperly formatted. Please contact the organizer.");
      return;
    }

    try {
      // Get user's current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const groupLat = group.location.lat;
          const groupLon = group.location.lon;

          const distance = calculateDistance(userLat, userLon, groupLat, groupLon);
          if (distance > 0.5) { // Allow check-in only if within 0.5 km
            alert("You are too far from the group location to check in.");
            return;
          }

          const sessionRef = doc(db, "groups", group.id, "classHistory", activeSession.id);
          const attendanceRecord = { id: user.uid, joined: new Date().toISOString() };
          await updateDoc(sessionRef, {
            attendees: arrayUnion(attendanceRecord)
          });
          alert("Class joined successfully.");
          setHasJoinedActive(true);
          // The real-time listener will update activeSession automatically.
        },
        (error) => {
          console.error("❌ Error getting location:", error);
          alert("Failed to get your location. Please enable location services.");
        }
      );
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

  // Function to leave the group
  const handleLeaveGroup = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to leave a group.");
      return;
    }
    if (!group || !group.id) {
      alert("Group data is missing.");
      return;
    }
    setLeaving(true);
    try {
      await leaveGroup(group.id, user.uid);
      alert("You have successfully left the group.");
      navigate("/attendeehome"); // Redirect to attendee home after leaving
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      alert("Failed to leave the group. Please try again.");
    } finally {
      setLeaving(false);
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
    <div className="group-page" style={{ background: "linear-gradient(120deg, #f8fafc 0%, #e3e9f7 100%)" }}>
      <SideNav
        activePage={activePage}
        setActivePage={setActivePage}
        handleLogout={handleLogout}
        confirmLogout={confirmLogout}
        setConfirmLogout={setConfirmLogout}
      />
      <main className="group-content" style={{
        maxWidth: 900,
        margin: "2.5rem auto",
        borderRadius: 22,
        boxShadow: "0 8px 32px rgba(44,62,80,0.10)",
        background: "#fff",
        padding: 0,
        overflow: "hidden"
      }}>
        {/* Group Info Card */}
        <div style={{
          background: "linear-gradient(90deg, #2ecc71 0%, #3498db 100%)",
          padding: "2.2rem 2rem 1.5rem 2rem",
          borderRadius: "0 0 32px 32px",
          color: "#fff",
          position: "relative"
        }}>
          <h1 style={{ fontSize: "2.3rem", fontWeight: 800, margin: 0, color: "#fff" }}>{group.groupName}</h1>
          <div style={{ display: "flex", gap: "2rem", marginTop: 10, fontSize: "1.15rem", flexWrap: "wrap" }}>
            <span>📍 {typeof group.location === "string"
              ? group.location
              : group.location && group.location.lat && group.location.lon
              ? `Lat: ${group.location.lat}, Lon: ${group.location.lon}`
              : "No location set"}</span>
            <span>📅 {Array.isArray(group.meetingDays) && group.meetingDays.length > 0
              ? group.meetingDays.join(", ")
              : "No days selected"} at {group.meetingTime || "No time set"}</span>
            <span>👤 {group.organizerName || "Unknown Organizer"}</span>
          </div>
        </div>

        {/* Tab Menu */}
        <div className="tab-menu" style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2rem",
          background: "#fff",
          position: "relative",
          margin: "0 0 0.5rem 0",
          borderBottom: "2px solid #e5e7eb"
        }}>
          {["active", "upcoming", "history", "settings"].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: activeTab === tab ? "#2ecc71" : "#374151",
                padding: "1.2rem 0.5rem",
                cursor: "pointer",
                outline: "none",
                borderBottom: activeTab === tab ? "3px solid #2ecc71" : "3px solid transparent",
                transition: "color 0.2s, border-bottom 0.2s"
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "active" && "Active Class"}
              {tab === "upcoming" && "Upcoming Classes"}
              {tab === "history" && "📜 History"}
              {tab === "settings" && "⚙ Settings"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content" style={{
          margin: "2rem auto",
          background: "#f8fafc",
          borderRadius: 18,
          boxShadow: "0 2px 10px rgba(44,62,80,0.06)",
          minHeight: 260,
          maxWidth: 700,
          padding: "2.5rem 2rem"
        }}>
          {activeTab === "active" && (
            <div>
              <h3 style={{ fontWeight: 700, color: "#2ecc71", marginBottom: "1rem" }}>Active Class</h3>
              {activeSession ? (
                <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(44,62,80,0.06)", padding: "1.2rem 1.5rem" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={{ fontWeight: 600, color: "#2c3e50" }}>Class:</span>{" "}
                    {activeSession.className ? activeSession.className : activeSession.date}
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={{ fontWeight: 600, color: "#2c3e50" }}>Attendees Checked In:</span>
                    {activeSession.attendees && activeSession.attendees.length > 0 ? (
                      <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
                        {activeSession.attendees.map((att) => (
                          <li key={att.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid #f2f2f2", fontSize: "1rem", color: "#374151" }}>
                            <span style={{ fontWeight: 500 }}>{att.id}</span>
                            <span style={{ color: "#7f8c8d" }}> – Joined at {att.joined}</span>
                            {att.left && <span style={{ color: "#b91c1c" }}> | Left at {att.left}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: "#7f8c8d", marginTop: 8 }}>No attendees have checked in yet.</div>
                    )}
                  </div>
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
                <div style={{ color: "#7f8c8d" }}>No active class at the moment.</div>
              )}
            </div>
          )}
          {activeTab === "upcoming" && (
            <div>
              <h3 style={{ fontWeight: 700, color: "#3498db", marginBottom: "1rem" }}>Upcoming Classes</h3>
              {upcomingSessions.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {upcomingSessions.map((session) => (
                    <li
                      key={session.id}
                      className="session-item"
                      onClick={() => handleSessionClick(session)}
                      style={{
                        background: "#fff",
                        borderRadius: 10,
                        marginBottom: "1rem",
                        padding: "1rem 1.5rem",
                        boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
                        border: "1px solid #eaeaea",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        fontWeight: 500,
                        color: "#2c3e50",
                        transition: "box-shadow 0.15s, transform 0.15s",
                      }}
                    >
                      <span>{session.date}</span>
                      {session.className && (
                        <span style={{ color: "#7f8c8d", marginLeft: 8 }}>{session.className}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#7f8c8d" }}>No upcoming classes available.</div>
              )}
            </div>
          )}
          {activeTab === "history" && (
            <div>
              <h3 style={{ fontWeight: 700, color: "#9b59b6", marginBottom: "1rem" }}>Class History</h3>
              {pastSessions.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {pastSessions.map((session) => (
                    <li key={session.id} style={{
                      background: "#fff",
                      borderRadius: 10,
                      marginBottom: "1rem",
                      padding: "1rem 1.5rem",
                      boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
                      border: "1px solid #eaeaea",
                    }}>
                      <div style={{ fontWeight: 600, color: "#2c3e50", marginBottom: 4 }}>
                        {session.date}
                        {session.className && (
                          <span style={{ color: "#7f8c8d", marginLeft: 8 }}>{session.className}</span>
                        )}
                      </div>
                      {session.attendees && session.attendees.length > 0 && (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {session.attendees.map((att) => (
                            <li key={att.id} style={{ fontSize: "1rem", color: "#374151", padding: "0.3rem 0", borderBottom: "1px solid #f2f2f2" }}>
                              <span style={{ fontWeight: 500 }}>{att.id}</span>
                              <span style={{ color: "#7f8c8d" }}> – Joined: {att.joined}</span>
                              {att.left && <span style={{ color: "#b91c1c" }}> | Left: {att.left}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#7f8c8d" }}>No past classes available.</div>
              )}
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h3 style={{ fontWeight: 700, color: "#e67e22", marginBottom: "1rem" }}>Settings</h3>
              <div style={{
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
                padding: "1.2rem 1.5rem",
                marginBottom: "1rem"
              }}>
                <p style={{ color: "#7f8c8d", marginBottom: "1rem" }}>
                  Leave this group if you no longer wish to participate.
                </p>
                <button
                  className="button danger remove-student"
                  style={{ marginTop: "0.5rem" }}
                  onClick={handleLeaveGroup}
                  disabled={leaving}
                >
                  {leaving ? "Leaving..." : "❌ Leave Group"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="button-container" style={{ justifyContent: "center" }}>
          <button className="button back-button" onClick={() => navigate("/attendeehome")}>
            ⬅ Back to Attendee Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default AttendeeGroupPage;
