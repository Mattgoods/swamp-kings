import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchUserInfo } from "../firebase/firebaseGroups"; // Import new function
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase"; // Firestore instance
import "./GroupPage.css";
import SideNav from "../components/SideNav";

const GroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  const [activeTab, setActiveTab] = useState("student");
  const [attendees, setAttendees] = useState([]); // ✅ Store attendees
  const [attendeeDetails, setAttendeeDetails] = useState([]); // ✅ Store detailed attendee info

  useEffect(() => {
    const fetchAttendees = async () => {
      if (!group?.id) return;

      try {
        const groupRef = doc(db, "groups", group.id);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          const attendeeIds = groupData.attendees || []; // ✅ Get array of attendee user IDs

          // ✅ Fetch detailed attendee info for each user ID
          const attendeePromises = attendeeIds.map(async (userId) => {
            return await fetchUserInfo(userId); // Fetch user info
          });

          const attendeeData = await Promise.all(attendeePromises);
          setAttendees(attendeeIds);
          setAttendeeDetails(attendeeData.filter((user) => user !== null)); // ✅ Remove null values
        }
      } catch (error) {
        console.error("❌ Error fetching attendees:", error);
      }
    };

    fetchAttendees();
  }, [group]);

  if (!group) {
    return (
      <div className="group-page">
        <p>No group data found. <a href="/organizerhome">⬅ Go Back</a></p>
      </div>
    );
  }

  return (
    <div className="group-page">
      <SideNav groupName={group.groupName} />

      <main className="group-content">
        <h1>{group.groupName}</h1>
        <p>📍 {group.location || "No location set"}</p>
        <p>📅 {Array.isArray(group.meetingDays) && group.meetingDays.length > 0 ? group.meetingDays.join(", ") : "No days selected"} at {group.meetingTime || "No time set"}</p>
        <p>👤 Organizer: {group.organizerName || "Unknown Organizer"}</p>

        <button className="button back-button" onClick={() => navigate("/organizerhome")}>
          ⬅ Back to Organizer Home
        </button>

        <div className="tab-menu">
          <button className={activeTab === "student" ? "active" : ""} onClick={() => setActiveTab("student")}>
            📋 Students
          </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
            📜 Class History
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            ⚙ Group Settings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "student" && (
            <div>
              <h3>📋 Student List</h3>
              {attendeeDetails.length > 0 ? (
                <ul>
                  {attendeeDetails.map((attendee) => (
                    <li key={attendee.id}>
                      <strong>{attendee.fullName}</strong> - {attendee.email} (ID: {attendee.id})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No students have joined this group yet.</p>
              )}
            </div>
          )}

          {activeTab === "history" && <p>📜 Class history will be shown here.</p>}
          {activeTab === "settings" && <p>⚙ Modify group settings here.</p>}
        </div>
      </main>
    </div>
  );
};

export default GroupPage;
