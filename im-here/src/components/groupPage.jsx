import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GroupPage.css"; // Style file
import SideNav from "../components/SideNav"; // Import SideNav component

const GroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  // Handle tab switching
  const [activeTab, setActiveTab] = useState("student");

  if (!group) {
    return (
      <div className="group-page">
        <p>No group data found. <a href="/organizerhome">⬅ Go Back</a></p>
      </div>
    );
  }

  return (
    <div className="group-page">
      {/* Side Navigation */}
      <SideNav groupName={group.groupName} />

      {/* Main Content */}
      <main className="group-content">
        <h1>{group.groupName}</h1>
        <p>📍 {group.location || "No location set"}</p>
        <p>📅 {Array.isArray(group.meetingDays) && group.meetingDays.length > 0 ? group.meetingDays.join(", ") : "No days selected"} at {group.meetingTime || "No time set"}</p>
        <p>👤 Organizer: {group.organizerName || "Unknown Organizer"}</p>

        {/* ✅ Back Button */}
        <button className="button back-button" onClick={() => navigate("/organizerhome")}>
          ⬅ Back to Organizer Home
        </button>

        {/* Tab Navigation */}
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

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "student" && <p>📌 Student records will be displayed here.</p>}
          {activeTab === "history" && <p>📜 Class history will be shown here.</p>}
          {activeTab === "settings" && <p>⚙ Modify group settings here.</p>}
        </div>
      </main>
    </div>
  );
};

export default GroupPage;
