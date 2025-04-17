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
  const [joiningGroupId, setJoiningGroupId] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  const [activeTab, setActiveTab] = useState("student");


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
        } catch (error) {
          console.error("❌ Error fetching groups:", error);
        }
      } else {
        console.log("❌ No authenticated user. Clearing groups...");
        setGroups([]);
        sessionStorage.clear();
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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f4f4" }}>
      <SideNav activePage={activePage} setActivePage={setActivePage} handleLogout={handleLogout} confirmLogout={confirmLogout}   setConfirmLogout={setConfirmLogout} // ✅ Add this
      />
      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "2.5rem 2rem", backgroundColor: "#ecf0f1" }}>
        <h1 style={{ marginBottom: "2rem", fontSize: "2rem", color: "#333" }}>Your Groups</h1>

        {/* ✅ DISPLAY USER GROUPS IN ORIGINAL BOX FORMAT */}
        {groups.length > 0 ? (
          <ul className="group-list">
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
                disabled={joiningGroupId === group.id} // ✅ Disable only the clicked button
              >
                {joiningGroupId === group.id ? "Joining..." : "Join"} 
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
