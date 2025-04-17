import React, { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { fetchOrganizerGroups, createGroup, deleteGroups } from "../firebase/firebaseGroups";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"; // Import Google Maps components
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
  const [selectedLocation, setSelectedLocation] = useState(null); // State for selected location

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyDdFYHNjvrmWaJMfmcwCdofLHziP84rzas", // Add your API key here
  });

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

  const handleMapClick = (event) => {
    setSelectedLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    });
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
  };

  const handleSearchLocation = () => {
    if (!location.trim()) {
      alert("Please enter a location to search.");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        setSelectedLocation({ lat: lat(), lng: lng() });
      } else {
        alert("Location not found. Please try again.");
      }
    });
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
      !semester ||
      !selectedLocation // Ensure location is selected
    ) {
      alert("All fields are required, including selecting a location on the map.");
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
        semester,
        selectedLocation // Pass selected location
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
    setSelectedLocation(null); // Reset selected location
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

      <main style={{ flex: 1, padding: "2rem", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", position: "relative" }}>
        <h1 style={{ marginBottom: "2rem", fontSize: "2.5rem", color: "#2c3e50", textAlign: "center", fontWeight: "bold" }}>
          Organizer Dashboard
        </h1>

        {loading ? (
          <p style={{ textAlign: "center", fontSize: "1.5rem", color: "#7f8c8d" }}>Loading groups...</p>
        ) : groups.length > 0 ? (
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", padding: 0, listStyle: "none" }}>
            {groups.map((group) => (
              <li
                key={group.id}
                style={{
                  backgroundColor: "#ffffff",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onClick={() => handleGroupClick(group)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 6px 14px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.1)";
                }}
              >
                <h3 style={{ fontSize: "1.5rem", color: "#34495e", marginBottom: "0.5rem", fontWeight: "600" }}>{group.groupName}</h3>
                <p style={{ fontSize: "1.2rem", color: "#7f8c8d", marginBottom: "0.5rem" }}>
                  <strong>Members:</strong> {group.attendees?.length || 0}
                </p>
                <p style={{ fontSize: "1.2rem", color: "#7f8c8d" }}>
                  <strong>Meeting Days:</strong> {group.meetingDays?.join(", ") || "Not set"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: "center", fontSize: "1.5rem", color: "#7f8c8d" }}>No groups found. Try adding one!</p>
        )}

        {/* Add Group Button */}
        <button
          style={{
            position: "absolute",
            bottom: "2rem",
            right: "2rem",
            padding: "1rem 2rem",
            backgroundColor: "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            fontSize: "1.5rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            transition: "background-color 0.3s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#2980b9";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#3498db";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => setIsModalOpen(true)}
        >
          ➕
        </button>
      </main>

      {isModalOpen && (
        <div className="modal" style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-content" style={{ maxWidth: "90%", width: "400px", padding: "1.5rem", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#333", textAlign: "center" }}>Create New Group</h3>
            
            <label>
              <strong>Group Name</strong>
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </label>

            <label>
              <strong>Select Meeting Days</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <label key={day} style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() =>
                        setSelectedDays((prev) =>
                          prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                        )
                      }
                    />
                    <span style={{ marginLeft: "0.5rem" }}>{day}</span>
                  </label>
                ))}
              </div>
            </label>

            <label>
              <strong>Meeting Time</strong>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </label>

            <label>
              <strong>Location</strong>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Enter location"
                  value={location}
                  onChange={handleLocationChange}
                  style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
                />
                <button
                  onClick={handleSearchLocation}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#4caf50",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Search
                </button>
              </div>
            </label>

            <label>
              <strong>Start Date</strong>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </label>

            <label>
              <strong>End Date</strong>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </label>

            <label>
              <strong>Semester</strong>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">Select Semester</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
              </select>
            </label>

            <label>
              <strong>Select Location on Map</strong>
              {isLoaded ? (
                <div
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    overflow: "hidden",
                    marginBottom: "1rem",
                    width: "100%",
                    height: "200px",
                  }}
                >
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={selectedLocation || { lat: 37.7749, lng: -122.4194 }}
                    zoom={selectedLocation ? 15 : 10}
                    onClick={handleMapClick}
                  >
                    {selectedLocation && <Marker position={selectedLocation} />}
                  </GoogleMap>
                </div>
              ) : (
                <p>Loading map...</p>
              )}
            </label>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <button
                onClick={handleCreateGroup}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Create
              </button>
              <button
                onClick={closeModal}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#d9534f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerHome;
