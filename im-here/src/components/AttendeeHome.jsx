import React, { useState, useEffect } from "react";
import { auth } from "../firebase/firebase"; // Firebase Auth
import { signOut, onAuthStateChanged } from "firebase/auth";
import { fetchUserGroups, fetchAllGroups, joinGroup } from "../firebase/firebaseGroups";
import Logo from "../assets/imherelogo-transparent.png";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; // Import Firestore instance
import { useNavigate } from "react-router-dom"; // ✅ Import navigation
import SideNav from "./SideNav";

const AttendeeHome = () => {
  const navigate = useNavigate(); // ✅ Initialize navigation
  const [groups, setGroups] = useState([]); // Groups the user has joined
  const [allGroups, setAllGroups] = useState([]); // All available groups
  const [searchQuery, setSearchQuery] = useState(""); // Search input
  const [searchResults, setSearchResults] = useState([]);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(""); // <-- Add this line

  // Helper to format time to 12-hour am/pm
  const formatTime = (timeStr) => {
    if (!timeStr) return "Not set";
    // Handles "HH:mm" or "H:mm" or "HH:mm:ss"
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr ? minuteStr.padStart(2, "0") : "00";
    if (isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("🔄 User authenticated:", user.uid);

        // ✅ First, check session storage for cached groups
        const cachedGroups = JSON.parse(sessionStorage.getItem("userGroups"));
        if (cachedGroups && cachedGroups.length > 0) {
          console.log("✅ Using cached groups from session storage");
          setGroups(cachedGroups);
        }

        try {
          console.log("📡 Fetching all available groups...");
          const allAvailableGroups = await fetchAllGroups();
          setAllGroups(allAvailableGroups);

          console.log("📡 Fetching user groups...");
          const userGroups = await fetchUserGroups(user.uid);
          setGroups(userGroups);
          sessionStorage.setItem("userGroups", JSON.stringify(userGroups)); // ✅ Cache user groups

          // Fetch user's name for dashboard heading
          let name = "";
          const teacherRef = doc(db, "teachers", user.uid);
          const teacherSnap = await getDoc(teacherRef);
          if (teacherSnap.exists()) {
            name = teacherSnap.data().fullName || "";
          } else {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              name = userSnap.data().fullName || "";
            }
          }
          setUserName(name);
        } catch (error) {
          console.error("❌ Error fetching groups:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("❌ No authenticated user. Clearing groups...");
        setGroups([]);
        sessionStorage.clear();
        setLoading(false);
        setUserName("");
      }
    });

    return () => unsubscribe(); // ✅ Unsubscribe when component unmounts
  }, []);

  const handleLogout = async () => {
    if (!confirmLogout) {
      console.log("🔍 Logout confirmation triggered");
      setConfirmLogout(true);
    } else {
      try {
        console.log("🚀 Logging out user...");

        // ✅ Clear session storage & local storage
        sessionStorage.clear();
        localStorage.clear();

        // ✅ Reset state
        setGroups([]);
        setAllGroups([]);
        setSearchQuery("");
        setSearchResults([]);

        // ✅ Firebase sign out
        await signOut(auth);
        console.log("✅ User successfully logged out");

        // ✅ Redirect to login page
        window.location.href = "/login";
      } catch (error) {
        console.error("❌ Logout Error:", error);
      }
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // ✅ Exclude groups that the user is already in
    const joinedGroupIds = new Set(groups.map((g) => g.id));

    const filteredGroups = allGroups.filter((group) => {
      return (
        !joinedGroupIds.has(group.id) && // ✅ Exclude joined groups
        (group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.organizerName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

    setSearchResults(filteredGroups);
    setSearchQuery(""); // ✅ Clear search bar after pressing search
  };

  const handleJoinGroup = async (group) => {
    if (joiningGroupId) return;
    setJoiningGroupId(group.id); // ✅ Track only the group being joined

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to join a group.");
      setJoiningGroupId(null);
      return;
    }

    try {
      await joinGroup(group.id, user.uid, user.email);

      // ✅ Fetch fresh data after joining
      const updatedUserGroups = await fetchUserGroups(user.uid);
      setGroups(updatedUserGroups);
      sessionStorage.setItem("userGroups", JSON.stringify(updatedUserGroups));

      // ✅ Remove the joined group from `allGroups`
      const updatedAllGroups = allGroups.filter((g) => g.id !== group.id);
      setAllGroups(updatedAllGroups);

      // ✅ Clear all search results
      setSearchResults([]);

      alert(`✅ Successfully joined ${group.groupName}`);
    } catch (error) {
      console.error("❌ Error joining group:", error);
      alert(error.message);
    } finally {
      setJoiningGroupId(null); // ✅ Reset state after join process is complete
    }
  };

  // ✅ Navigate to AttendeeGroupPage
  const handleGroupClick = (group) => {
    navigate("/attendeegrouppage", { state: { group } });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <SideNav
        activePage={activePage}
        setActivePage={setActivePage}
        handleLogout={handleLogout}
        confirmLogout={confirmLogout}
        setConfirmLogout={setConfirmLogout}
      />

      <main
        style={{
          flex: 1,
          padding: "2.5rem",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          margin: "2rem",
          minHeight: "calc(100vh - 4rem)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1
          style={{
            marginBottom: "2.5rem",
            fontSize: "2.5rem",
            color: "#2c3e50",
            textAlign: "center",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          {userName ? `${userName}'s Dashboard` : "Dashboard"}
        </h1>

        {/* Search to Join a Group */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "2.5rem",
            gap: "1rem",
          }}
        >
          <input
            type="text"
            placeholder="Search for a group or organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "1.1rem",
              width: "320px",
              background: "#f8fafc",
              outline: "none",
              transition: "border 0.2s",
            }}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={e => (e.target.style.backgroundColor = "#2980b9")}
            onMouseLeave={e => (e.target.style.backgroundColor = "#3498db")}
          >
            Search
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div
            className="search-results-dropdown"
            style={{
              margin: "0 auto 2.5rem auto",
              maxWidth: "700px",
              width: "100%",
              background: "#f4f8fb",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(44,62,80,0.07)",
              padding: "1.5rem 2rem",
              position: "relative",
            }}
          >
            <h2 style={{ fontSize: "1.3rem", color: "#34495e", marginBottom: "1rem", fontWeight: 600 }}>
              Join a Group
            </h2>
            <button
              onClick={() => setSearchResults([])}
              style={{
                position: "absolute",
                top: "1.2rem",
                right: "1.5rem",
                background: "none",
                border: "none",
                color: "#7f8c8d",
                fontSize: "1.2rem",
                cursor: "pointer",
                fontWeight: 600,
                padding: 0,
              }}
              aria-label="Cancel search results"
            >
              ×
            </button>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {searchResults.map((group) => (
                <li
                  key={group.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#fff",
                    borderRadius: "8px",
                    padding: "1rem 1.5rem",
                    marginBottom: "1rem",
                    boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "#2c3e50" }}>{group.groupName}</div>
                    <div style={{ fontSize: "1rem", color: "#7f8c8d" }}>
                      Organizer: {group.organizerName || "Unknown"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinGroup(group)}
                    disabled={joiningGroupId === group.id}
                    style={{
                      padding: "0.6rem 1.2rem",
                      backgroundColor: "#4caf50",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      cursor: joiningGroupId === group.id ? "not-allowed" : "pointer",
                      opacity: joiningGroupId === group.id ? 0.7 : 1,
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={e => (e.target.style.backgroundColor = "#388e3c")}
                    onMouseLeave={e => (e.target.style.backgroundColor = "#4caf50")}
                  >
                    {joiningGroupId === group.id ? "Joining..." : "Join"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* User's Groups */}
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: "1.5rem", color: "#7f8c8d" }}>Loading groups...</p>
          </div>
        ) : groups.length > 0 ? (
          <ul
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "2rem",
              padding: 0,
              listStyle: "none",
              margin: 0,
            }}
          >
            {groups.map((group) => (
              <li
                key={group.id}
                style={{
                  background: "linear-gradient(135deg, #f8fafc 60%, #e3e9f7 100%)",
                  padding: "2rem 1.5rem",
                  borderRadius: "14px",
                  boxShadow: "0 4px 16px rgba(44,62,80,0.07)",
                  cursor: "pointer",
                  transition: "transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s cubic-bezier(.4,0,.2,1)",
                  border: "1px solid #eaeaea",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "180px",
                }}
                onClick={() => handleGroupClick(group)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(44,62,80,0.13)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,62,80,0.07)";
                }}
              >
                <h3 style={{ fontSize: "1.6rem", color: "#34495e", marginBottom: "0.7rem", fontWeight: 700 }}>
                  {group.groupName}
                </h3>
                <p style={{ fontSize: "1.1rem", color: "#7f8c8d", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 500 }}>Organizer:</span> {group.organizerName || "Unknown"}
                </p>
                <p style={{ fontSize: "1.1rem", color: "#7f8c8d", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 500 }}>Meeting Days:</span> {group.meetingDays?.join(", ") || "Not set"}
                </p>
                <p style={{ fontSize: "1.1rem", color: "#7f8c8d" }}>
                  <span style={{ fontWeight: 500 }}>Time:</span> {formatTime(group.meetingTime)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ textAlign: "center", fontSize: "1.5rem", color: "#7f8c8d" }}>
              No groups found.<br />Join a group to get started!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AttendeeHome;
