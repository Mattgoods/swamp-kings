import React, { useState, useEffect } from "react";
import "./OrganizerHome.css"; // Import CSS file
import Logo from "../assets/imherelogo-transparent.png";
import { fetchOrganizerGroups, createGroup } from "../firebase/firebaseGroups";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth"; // Import Firebase sign-out function
import { onAuthStateChanged } from "firebase/auth"; // Import auth state listener
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate

const OrganizerHome = () => {
  // ======= Store real groups from Firestore =======
  const [groups, setGroups] = useState([]); // Initially empty, filled from Firestore
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // ✅ Prevent duplicate clicks
  const navigate = useNavigate(); // ✅ Initialize navigation

  // ======= Modal state for adding a new group =======
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [meetingTime, setMeetingTime] = useState("");
  const [location, setLocation] = useState("");

  // ======= Navigation state =======
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // ======= Fetch groups from Firestore when component loads =======
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User detected:", user.uid); // ✅ Debug log
        try {
          const groupsData = await fetchOrganizerGroups(user.uid);
          console.log("Groups retrieved:", groupsData); // ✅ Debug log
          setGroups(groupsData);
        } catch (error) {
          console.error("Error loading groups:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.warn("No user signed in");
        setLoading(false);
      }
    });
  
    return () => unsubscribe(); // ✅ Cleanup function to prevent memory leaks
  }, []);
  

  // ======= Handle Logout =======
  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true); // First click asks for confirmation
    } else {
      try {
        await signOut(auth); // Firebase logout
        window.location.href = "/login"; // Redirect to login page
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  // ======= Handle Modal =======
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setGroupName("");
    setSelectedDays([]);
    setLocation("");
    setMeetingTime("");
  };

  // ======= Handle Selecting Days =======
  const toggleDay = (day) => {
    setSelectedDays((prevDays) =>
      prevDays.includes(day) ? prevDays.filter((d) => d !== day) : [...prevDays, day]
    );
  };

  // ======= Handle Creating Group =======

const handleCreateGroup = async () => {
  if (isCreating) return; // ✅ Prevent duplicate submissions

  if (!groupName.trim()) {
    alert("Group name cannot be empty.");
    return;
  }

  if (selectedDays.length === 0) {
    alert("Please select at least one meeting day.");
    return;
  }

  if (!meetingTime || meetingTime.trim() === "") {
    alert("Please select a meeting time.");
    return;
  }

  if (!location.trim()) {
    alert("Please enter a location.");
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to create a group.");
    return;
  }

  setIsCreating(true); // ✅ Disable button while creating group

  try {
    // ✅ Step 1: Check if a group with the same name already exists
    const existingGroups = await fetchOrganizerGroups(user.uid);
    if (existingGroups.some(group => group.groupName.toLowerCase() === groupName.toLowerCase())) {
      alert("A group with this name already exists!");
      setIsCreating(false);
      return;
    }

    // ✅ Step 2: Create the group in Firestore
    const groupId = await createGroup(groupName, selectedDays, meetingTime, location);
    if (groupId) {
      const updatedGroups = await fetchOrganizerGroups(user.uid);
      setGroups(updatedGroups);
      closeModal();
    }
  } catch (error) {
    console.error("❌ Error creating group:", error);
  } finally {
    setIsCreating(false); // ✅ Re-enable button after request completes
  }
};

const handleGroupClick = (group) => {
  navigate("/grouppage", { state: { group } }); // ✅ Pass group data using `state`
};
  return (
    <div className="organizer-home">
      {/* ======= SIDEBAR ======= */}
      <aside className="sidebar">
        <img src={Logo} alt="Logo" className="logo" onClick={() => setActivePage("dashboard")} />
        <h2 className="sidebar-title">My Dashboard</h2>

        <nav>
          <ul>
            <li
              className={activePage === "dashboard" ? "active" : ""}
              onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={activePage === "settings" ? "active" : ""}
              onClick={() => setActivePage("settings")}
            >
              Settings
            </li>
            <li className="logout" onClick={handleLogout}>
              {confirmLogout ? "Confirm Logout?" : "Logout"}
            </li>
          </ul>
        </nav>
      </aside>

      {/* ======= MAIN CONTENT ======= */}
      <main className="main-content">
        {activePage === "dashboard" && (
          <>
            <h2>Your Groups</h2>
            {loading ? (
              <p>Loading groups...</p>
            ) : groups.length > 0 ? (
              <ul className="group-list">
                {groups.map((group) => (
                  <li key={group.id} onClick={() => handleGroupClick(group)}> {/* ✅ Click to navigate */}
                    <strong>{group.groupName}</strong> - {group.selectedDays?.join(", ")} at {group.meetingTime}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No groups found. Try adding one!</p>
            )}
            <button className="button primary" onClick={openModal}>+ Add Group</button>
          </>
        )}

        {/* ======= SETTINGS PAGE ======= */}
        {activePage === "settings" && (
          <div className="settings-page">
            <h2>Global Settings</h2>
            <p>Manage your platform settings here.</p>
            <button className="button primary" onClick={() => setActivePage("dashboard")}>
              Return to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* ======= MODAL FOR ADDING GROUP ======= */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Group</h3>

            {/* Group Name Input */}
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            {/* Meeting Days Selection */}
            <div className="meeting-days">
              <h4>Select Meeting Days</h4>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => toggleDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>

            {/* Meeting Time Selection */}
            <div className="meeting-time">
              <h4>Select Meeting Time</h4>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
            </div>
            <div className="group-location">
              <h4>Enter Location</h4>
              <input
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>;
            <div className="modal-buttons">
              <button className="button primary" onClick={handleCreateGroup} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </button>
              <button className="button danger" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerHome;
