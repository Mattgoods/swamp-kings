import React, { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { fetchOrganizerGroups, createGroup, deleteGroups } from "../firebase/firebaseGroups";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./OrganizerHome.css";
import SideNav from "./SideNav";

const OrganizerHome = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [isCreating, setIsCreating] = useState(false);

  // Group Form State
  const [groupName, setGroupName] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [meetingTime, setMeetingTime] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Key used for caching the groups data in sessionStorage
  const storageKey = "organizerGroups";

  // Function to fetch groups data from Firebase
  const fetchGroupsData = async (uid) => {
    try {
      const groupsData = await fetchOrganizerGroups(uid);
      setGroups(groupsData);
      sessionStorage.setItem(storageKey, JSON.stringify(groupsData));
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // On mount, clear any cached groups data so that fresh data is always fetched
  useEffect(() => {
    sessionStorage.removeItem(storageKey);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchGroupsData(user.uid);
      } else {
        setLoading(false);
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
        sessionStorage.removeItem(storageKey); // Clear cached groups on logout
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  const handleCreateGroup = async () => {
    if (isCreating) return;

    if (
      !groupName.trim() ||
      !meetingTime.trim() ||
      !location.trim() ||
      selectedDays.length === 0 ||
      !startDate ||
      !endDate ||
      !semester
    ) {
      alert("All fields are required.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to create a group.");
      return;
    }

    setIsCreating(true);

    try {
      const existingGroups = await fetchOrganizerGroups(user.uid);
      if (
        existingGroups.some(
          (group) => group.groupName.toLowerCase() === groupName.toLowerCase()
        )
      ) {
        alert("A group with this name already exists!");
        setIsCreating(false);
        return;
      }

      const groupId = await createGroup(
        groupName,
        selectedDays,
        meetingTime,
        location,
        startDate,
        endDate,
        semester
      );
      if (groupId) {
        // Always fetch fresh groups and update cache
        const updatedGroups = await fetchOrganizerGroups(user.uid);
        setGroups(updatedGroups);
        sessionStorage.setItem(storageKey, JSON.stringify(updatedGroups));
        closeModal();
      }
    } catch (error) {
      console.error("❌ Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGroups.length === 0) {
      alert("No groups selected for deletion.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedGroups.length} selected group(s)?`
    );
    if (!confirmDelete) return;

    try {
      await deleteGroups(selectedGroups);
      const updated = groups.filter((group) => !selectedGroups.includes(group.id));
      setGroups(updated);
      sessionStorage.setItem(storageKey, JSON.stringify(updated));
      setSelectedGroups([]);
    } catch (error) {
      console.error("❌ Error deleting selected groups:", error);
    }
  };

  const handleGroupClick = (group) => {
    navigate("/grouppage", { state: { group } });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGroupName("");
    setSelectedDays([]);
    setLocation("");
    setMeetingTime("");
    setStartDate("");
    setEndDate("");
    setSemester("");
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

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2.5rem 2rem", backgroundColor: "#ecf0f1" }}>
        <h1 style={{ marginBottom: "2rem", fontSize: "2rem", color: "#333" }}>Your Groups</h1>

        {loading ? (
          <p>Loading groups...</p>
        ) : groups.length > 0 ? (
          <ul className="group-list">
            {groups.map((group) => (
              <li
                key={group.id}
                style={{
                  backgroundColor: "#fff",
                  padding: "1rem",
                  borderRadius: "6px",
                  margin: "0.5rem 0",
                  cursor: "pointer",
                }}
                onClick={() => handleGroupClick(group)}
              >
                <strong>{group.groupName}</strong> - {group.attendees?.length || 0} members
              </li>
            ))}
          </ul>
        ) : (
          <p>No groups found. Try adding one!</p>
        )}

        {/* Add Group Button */}
        <div className="group-actions" style={{ marginTop: "2rem" }}>
          <button
            className="button primary"
            style={{ padding: "0.5rem 1rem", backgroundColor: "#4caf50", color: "#fff", cursor: "pointer" }}
            onClick={() => setIsModalOpen(true)}
          >
            + Add Group
          </button>
          <br />
          <button
            className="button danger"
            style={{ padding: "0.5rem 1rem", backgroundColor: "#d9534f", color: "#fff", cursor: "pointer" }}
            onClick={handleDeleteSelected}
            disabled={selectedGroups.length === 0}
          >
            🗑 Delete Groups
          </button>
        </div>
      </main>

      {/* Modal for Creating Groups */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Create New Group</h3>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <h4>Select Meeting Days</h4>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <label key={day}>
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day)}
                  onChange={() =>
                    setSelectedDays((prev) =>
                      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                    )
                  }
                />
                {day}
              </label>
            ))}

            <h4>Select Meeting Time</h4>
            <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />

            <h4>Enter Location</h4>
            <input type="text" placeholder="Enter location" value={location} onChange={(e) => setLocation(e.target.value)} />

            <h4>Start Date</h4>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

            <h4>End Date</h4>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

            <h4>Semester</h4>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">Select Semester</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
            </select>

			<br />

            <button className="button primary" onClick={handleCreateGroup}>
              Create
            </button>
            <button className="button danger" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerHome;
