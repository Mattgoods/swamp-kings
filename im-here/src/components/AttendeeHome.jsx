import React, { useState, useEffect, useRef } from "react";
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
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef(null);

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHighlightedIndex(-1);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timeout = setTimeout(() => {
      const joinedGroupIds = new Set(groups.map((g) => g.id));
      const filteredGroups = allGroups.filter((group) => {
        return (
          !joinedGroupIds.has(group.id) &&
          (group.groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.organizerName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      });
      setSearchResults(filteredGroups);
      setHighlightedIndex(filteredGroups.length > 0 ? 0 : -1);
      setSearchLoading(false);
    }, 180);
    return () => clearTimeout(timeout);
  }, [searchQuery, allGroups, groups]);

  useEffect(() => {
    if (!searchResults.length) return;
    const handleKeyDown = (e) => {
      if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowDown") setHighlightedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
      else if (e.key === "ArrowUp") setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      else if (e.key === "Enter" && highlightedIndex >= 0) handleJoinGroup(searchResults[highlightedIndex]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchResults, highlightedIndex]);

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

        {/* Modern Search Bar */}
        <div style={{
          position: "relative",
          maxWidth: 420,
          margin: "0 auto 2.5rem auto",
          width: "100%",
        }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a group or organizer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.85rem 2.5rem 0.85rem 1rem",
              borderRadius: "10px",
              border: "1.5px solid #d1d5db",
              fontSize: "1.15rem",
              background: "#f8fafc",
              outline: "none",
              boxShadow: "0 2px 8px rgba(44,62,80,0.06)",
              transition: "border 0.2s, box-shadow 0.2s",
            }}
            autoComplete="off"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setHighlightedIndex(-1);
                setSearchLoading(false);
                searchInputRef.current?.focus();
              }}
              style={{
                position: "absolute",
                right: "2.2rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#aaa",
                fontSize: "1.3rem",
                cursor: "pointer",
                zIndex: 2,
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          {/* Spinner */}
          {searchLoading && (
            <span
              style={{
                position: "absolute",
                right: "0.8rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: "1.2rem",
                height: "1.2rem",
                border: "2px solid #3498db",
                borderTop: "2px solid #f3f3f3",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                display: "inline-block",
                background: "transparent",
              }}
            />
          )}
          <style>
            {`
              @keyframes spin {
                0% { transform: translateY(-50%) rotate(0deg);}
                100% { transform: translateY(-50%) rotate(360deg);}
              }
            `}
          </style>
          {/* Floating Dropdown */}
          {searchResults.length > 0 && (
            <div
              className="search-results-dropdown"
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(44,62,80,0.13)",
                padding: "0.5rem 0",
                zIndex: 10,
                border: "1px solid #e5e7eb",
                transition: "box-shadow 0.2s, border 0.2s",
                backdropFilter: "blur(2px)",
                marginTop: 6,
              }}
            >
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {searchResults.map((group, idx) => (
                  <li
                    key={group.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: highlightedIndex === idx ? "#f0f8ff" : "transparent",
                      borderRadius: "10px",
                      padding: "1rem 1.5rem",
                      marginBottom: idx !== searchResults.length - 1 ? "0.5rem" : 0,
                      borderBottom: idx !== searchResults.length - 1 ? "1px solid #f2f2f2" : "none",
                      boxShadow: highlightedIndex === idx ? "0 2px 12px rgba(44,62,80,0.08)" : "none",
                      cursor: "pointer",
                      outline: highlightedIndex === idx ? "2px solid #3498db" : "none",
                      transition: "background 0.15s, box-shadow 0.15s, outline 0.15s",
                    }}
                    tabIndex={0}
                    onClick={() => handleJoinGroup(group)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleJoinGroup(group);
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 600, color: "#2c3e50", marginBottom: 2 }}>
                        {group.groupName}
                      </div>
                      <div style={{ fontSize: "1rem", color: "#7f8c8d" }}>
                        Organizer: {group.organizerName || "Unknown"}
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleJoinGroup(group);
                      }}
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
                        boxShadow: "0 1px 4px rgba(44,62,80,0.08)",
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
        </div>

        {/* User's Groups */}
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: "1.5rem", color: "#7f8c8d" }}>Loading groups...</p>
          </div>
        ) : groups.length > 0 ? (
          <ul
            className="class-card-list"
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
                className="class-card"
                onClick={() => handleGroupClick(group)}
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleGroupClick(group);
                }}
              >
                <h3>{group.groupName}</h3>
                <p>
                  <span style={{ fontWeight: 500 }}>Organizer:</span>{" "}
                  {group.organizerName || "Unknown"}
                </p>
                <p>
                  <span style={{ fontWeight: 500 }}>Meeting Days:</span>{" "}
                  {group.meetingDays?.join(", ") || "Not set"}
                </p>
                <p>
                  <span style={{ fontWeight: 500 }}>Time:</span>{" "}
                  {formatTime(group.meetingTime)}
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
