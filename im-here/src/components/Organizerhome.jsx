import React, { useState } from "react";
import Logo from "../assets/imherelogo-transparent.png";

const OrganizerHome = () => {
  // ======== Dummy group data (replace with real data) ========
  const [groups, setGroups] = useState([
    { id: 1, name: "Group A" },
    { id: 2, name: "Group B" },
    { id: 3, name: "Group C" },
  ]);

  // ======== State for which main "page" is active ========
  // Possible values: "dashboard", "settings".
  const [activePage, setActivePage] = useState("dashboard");

  // ======== State for group details (when on Dashboard) ========
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedView, setSelectedView] = useState(null);

  // ======== For double-click logout ========
  const [confirmLogout, setConfirmLogout] = useState(false);

  // ======== Handlers for pages ========
  // Switch to Dashboard page & reset group details and logout confirmation
  const goToDashboard = () => {
    setActivePage("dashboard");
    setSelectedGroup(null);
    setSelectedView(null);
    setConfirmLogout(false); // reset if user was in the middle of confirming logout
  };

  // Switch to Settings page & reset group details and logout confirmation
  const goToSettings = () => {
    setActivePage("settings");
    setSelectedGroup(null);
    setSelectedView(null);
    setConfirmLogout(false); // reset
  };

  // When user clicks the Logout nav item
  // - First click: ask for confirmation (setConfirmLogout=true)
  // - Second click: actually navigate to "/login"
  const handleLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true); // first click: show "Confirm Logout"
    } else {
      // second click: redirect to Login page
      window.location.href = "/login"; 
      // Alternatively, if you have a different route or file path, adjust accordingly
    }
  };

  // Clicking a group on the dashboard
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setSelectedView(null);
  };

  // Add a new group (dummy)
  const addGroup = () => {
    const newGroup = {
      id: groups.length + 1,
      name: `New Group ${groups.length + 1}`,
    };
    setGroups([...groups, newGroup]);
  };

  // Return to list of groups from a selected group
  const handleBackToList = () => {
    setSelectedGroup(null);
    setSelectedView(null);
  };

  // ======== Styling ========
  const dashboardContainer = {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f4f4f4",
  };

  // Sidebar
  const sidebarStyle = {
    width: "260px",
    background: "linear-gradient(135deg, #2c3e50, #34495e)",
    color: "#ecf0f1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 1rem",
  };

  const logoStyle = {
    width: "90px",
    height: "90px",
    marginBottom: "1rem",
    objectFit: "contain",
    cursor: "pointer", // So user knows it's clickable
  };

  const sidebarTitleStyle = {
    margin: "0 0 2rem 0",
    fontSize: "1.8rem",
    fontWeight: "bold",
    letterSpacing: "1px",
  };

  // Navigation
  const navStyle = {
    width: "100%",
    marginTop: "1rem",
  };

  const navListStyle = {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };

  const navListItemStyle = {
    padding: "0.75rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s ease",
  };

  const navListItemHoverStyle = {
    backgroundColor: "#1c2833",
  };

  // Main area
  const mainStyle = {
    flex: 1,
    padding: "2.5rem 2rem",
    backgroundColor: "#ecf0f1",
  };

  const headerStyle = {
    marginBottom: "2rem",
    fontSize: "2rem",
    color: "#333",
  };

  // Group list
  const groupListStyle = {
    listStyle: "none",
    padding: 0,
    margin: "0 0 1.5rem",
    maxWidth: "600px",
  };

  const groupItemStyle = {
    backgroundColor: "#fff",
    margin: "0.5rem 0",
    padding: "1rem 1.5rem",
    borderRadius: "6px",
    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
    fontSize: "1rem",
    color: "#555",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const groupItemHoverStyle = {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
  };

  const noGroupsStyle = {
    fontStyle: "italic",
    color: "#777",
    marginBottom: "1.5rem",
  };

  // Buttons
  const buttonBaseStyle = {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    transition: "background-color 0.3s ease",
    marginRight: "0.5rem",
    marginTop: "1rem",
  };

  const primaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: "#4a90e2",
  };

  const dangerButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: "#555",
  };

  // Hover states for nav items & group items, etc.
  const [hoveredNavItemIndex, setHoveredNavItemIndex] = useState(null);
  const [hoveredGroupItem, setHoveredGroupItem] = useState(null);
  const [isPrimaryButtonHovered, setIsPrimaryButtonHovered] = useState(false);

  // Navigation items
  const navItems = [
    {
      label: "Dashboard",
      value: "dashboard",
      action: goToDashboard,
    },
    {
      label: "Settings",
      value: "settings",
      action: goToSettings,
    },
    {
      // If user hasn't confirmed logout, label is "Logout"
      // If they have, label is "Confirm Logout"
      label: confirmLogout ? "Confirm Logout" : "Logout",
      value: "logout",
      action: handleLogout,
    },
  ];

  return (
    <div style={dashboardContainer}>
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <img
          style={logoStyle}
          src={Logo}
          alt="My Logo"
          onClick={goToDashboard} // Clicking logo goes to dashboard
        />
        <h2 style={sidebarTitleStyle}>My Dashboard</h2>

        {/* Navigation Menu */}
        <nav style={navStyle}>
          <ul style={navListStyle}>
            {navItems.map((item, index) => {
              const isActive = activePage === item.value;
              return (
                <li
                  key={index}
                  style={{
                    ...navListItemStyle,
                    // Hover style if user is hovering this item
                    ...(hoveredNavItemIndex === index
                      ? navListItemHoverStyle
                      : {}),
                    // Highlight if it's the current "page" (except for logout)
                    ...(isActive && item.value !== "logout"
                      ? { backgroundColor: "#1c2833" }
                      : {}),
                  }}
                  onMouseEnter={() => setHoveredNavItemIndex(index)}
                  onMouseLeave={() => setHoveredNavItemIndex(null)}
                  onClick={item.action}
                >
                  {item.label}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main style={mainStyle}>
        {/* DASHBOARD PAGE ===================================== */}
        {activePage === "dashboard" && (
          <>
            {/* If no group is selected, show the list of groups */}
            {!selectedGroup && (
              <>
                <h1 style={headerStyle}>Your Groups</h1>
                {groups.length > 0 ? (
                  <ul style={groupListStyle}>
                    {groups.map((group) => (
                      <li
                        key={group.id}
                        style={{
                          ...groupItemStyle,
                          ...(hoveredGroupItem === group.id
                            ? groupItemHoverStyle
                            : {}),
                        }}
                        onMouseEnter={() => setHoveredGroupItem(group.id)}
                        onMouseLeave={() => setHoveredGroupItem(null)}
                        onClick={() => handleGroupClick(group)}
                      >
                        {group.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={noGroupsStyle}>No groups found. Try adding one!</p>
                )}

                <button
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: isPrimaryButtonHovered
                      ? "#357abD"
                      : "#4a90e2",
                  }}
                  onClick={addGroup}
                  onMouseEnter={() => setIsPrimaryButtonHovered(true)}
                  onMouseLeave={() => setIsPrimaryButtonHovered(false)}
                >
                  Add Group
                </button>
              </>
            )}

            {/* If a group is selected, show group details */}
            {selectedGroup && (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  maxWidth: "700px",
                }}
              >
                <h1
                  style={{
                    marginBottom: "1rem",
                    fontSize: "1.8rem",
                    color: "#333",
                  }}
                >
                  {selectedGroup.name}
                </h1>

                {/* Buttons for group actions */}
                <button
                  style={{ ...primaryButtonStyle, marginRight: "1rem" }}
                  onClick={() => setSelectedView("settings")}
                >
                  Group Settings
                </button>
                <button
                  style={{ ...primaryButtonStyle, backgroundColor: "#2ecc71" }}
                  onClick={() => setSelectedView("stats")}
                >
                  Group Stats
                </button>
                <button
                  style={{ ...dangerButtonStyle }}
                  onClick={handleBackToList}
                >
                  Back to Group List
                </button>

                {/* Sub-views */}
                {selectedView === "settings" && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>
                      Settings for {selectedGroup.name}
                    </h2>
                    <p style={{ color: "#555" }}>
                      Manage group settings (rename, remove, etc.).
                    </p>
                  </div>
                )}

                {selectedView === "stats" && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>
                      Stats for {selectedGroup.name}
                    </h2>
                    <p style={{ color: "#555" }}>
                      Show group stats (member count, activity, etc.).
                    </p>
                  </div>
                )}

                {/* If no specific sub-view is selected */}
                {!selectedView && (
                  <p style={{ marginTop: "1rem", color: "#555" }}>
                    Please select an option (Settings/Stats) above to see more
                    details.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* GLOBAL SETTINGS PAGE =============================== */}
        {activePage === "settings" && (
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              maxWidth: "700px",
            }}
          >
            <h1 style={{ marginBottom: "1rem", fontSize: "1.8rem", color: "#333" }}>
              Global Settings
            </h1>
            <p style={{ color: "#555" }}>
              Here you could display and manage global settings for your user or
              the entire platform (e.g. theme, account info, etc.).
            </p>
            <button
              style={{ ...dangerButtonStyle, marginTop: "1rem" }}
              onClick={goToDashboard}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrganizerHome;
