import React, { useState, useEffect } from "react";
import { auth } from "../firebase/firebase"; // Firebase Auth
import { signOut, onAuthStateChanged } from "firebase/auth";
import { fetchUserGroups, fetchAllGroups, joinGroup } from "../firebase/firebaseGroups";
import Logo from "../assets/imherelogo-transparent.png";
import "./OrganizerHome.css"; // Import CSS file
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
  const [joining, setJoining] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userGroups = await fetchUserGroups(user.uid);
          setGroups(userGroups);
          const allAvailableGroups = await fetchAllGroups();

          // ✅ Filter out groups that the user is already a member of
          const filteredGroups = allAvailableGroups.filter(
            (group) => !userGroups.some((ug) => ug.id === group.id)
          );

          setAllGroups(filteredGroups);
        } catch (error) {
          console.error("Error fetching groups:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredGroups = allGroups.filter((group) => {
      const groupName = group.groupName ? group.groupName.toLowerCase() : "";
      const organizer = group.organizerName ? group.organizerName.toLowerCase() : "";
      const groupId = group.id ? group.id.toLowerCase() : "";

      return (
        groupName.includes(searchQuery.toLowerCase()) ||
        organizer.includes(searchQuery.toLowerCase()) ||
        groupId.includes(searchQuery.toLowerCase())
      );
    });

    setSearchResults(filteredGroups);
  };

  const handleJoinGroup = async (group) => {
    if (joining) return;
    setJoining(true);

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to join a group.");
      setJoining(false);
      return;
    }

    try {
      // ✅ Fetch user details from Firestore if missing
      let userName = user.displayName;
      let userEmail = user.email;

      if (!userName || !userEmail) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userName = userDoc.data().fullName || "Unknown User";
          userEmail = userDoc.data().email || "No Email";
        } else {
          throw new Error("User data not found in Firestore.");
        }
      }

      await joinGroup(group.id, user.uid, userName, userEmail);

      // ✅ Refresh groups after joining
      const updatedUserGroups = await fetchUserGroups(user.uid);
      setGroups(updatedUserGroups);

      alert(`✅ Successfully joined ${group.groupName}`);
      setSearchResults([]); // Clear search results after joining
    } catch (error) {
      console.error("❌ Error joining group:", error);
      alert(error.message);
    } finally {
      setJoining(false);
    }
  };

  // ✅ Navigate to AttendeeGroupPage
  const handleGroupClick = (group) => {
    navigate("/attendeegrouppage", { state: { group } });
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f4f4" }}>
      <SideNav activePage={activePage} setActivePage={setActivePage} handleLogout={handleLogout} confirmLogout={confirmLogout} />
      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "2.5rem 2rem", backgroundColor: "#ecf0f1" }}>
        <h1 style={{ marginBottom: "2rem", fontSize: "2rem", color: "#333" }}>Your Groups</h1>

        {/* ✅ DISPLAY USER GROUPS IN ORIGINAL BOX FORMAT */}
        {groups.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, maxWidth: "600px" }}>
            {groups.map((group) => (
              <li
                key={group.id}
                style={{ 
                  backgroundColor: "#fff", 
                  padding: "1rem", 
                  borderRadius: "6px", 
                  margin: "0.5rem 0", 
                  cursor: "pointer" 
                }}
                onClick={() => handleGroupClick(group)} // ✅ Click to navigate
              >
                <strong>{group.groupName}</strong> - {group.organizerName}
              </li>
            ))}
          </ul>
        ) : (
          <p>No groups found. Try joining one!</p>
        )}

        {/* SEARCH BAR */}
        <div style={{ marginTop: "2rem" }}>
          <input
            type="text"
            placeholder="Search by group name, ID, or professor"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "0.5rem", marginRight: "1rem" }}
          />
          <button 
            style={{ padding: "0.5rem 1rem", backgroundColor: "#4a90e2", color: "#fff", cursor: "pointer" }} 
            onClick={handleSearch}
          >
            Search
          </button>
        </div>

        {/* SEARCH RESULTS */}
        {searchResults.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, maxWidth: "600px", marginTop: "1.5rem" }}>
            {searchResults.map((group) => (
              <li key={group.id} style={{ backgroundColor: "#fff", padding: "1rem", borderRadius: "6px", margin: "0.5rem 0" }}>
                <strong>{group.groupName}</strong> - {group.organizerName}
                <button 
                  style={{ padding: "0.5rem 1rem", backgroundColor: "#4a90e2", color: "#fff", cursor: "pointer", marginLeft: "1rem" }} 
                  onClick={() => handleJoinGroup(group)}
                  disabled={joining}
                >
                  {joining ? "Joining..." : "Join"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default AttendeeHome;
