import React, { useState } from "react";
import Logo from "../assets/imherelogo-transparent.png";

const OrganizerHome = () => {
  // Dummy state for groups (replace with API data later)
  const [groups, setGroups] = useState([
    { id: 1, name: "Group A" },
    { id: 2, name: "Group B" },
    { id: 3, name: "Group C" },
  ]);

  // Function to add a new group (dummy implementation)
  const addGroup = () => {
    const newGroup = {
      id: groups.length + 1,
      name: `New Group ${groups.length + 1}`,
    };
    setGroups([...groups, newGroup]);
  };

  // Inline styles

  // Outer container for the entire dashboard
  const dashboardContainer = {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f4f4",
  };

  // Sidebar
  const sidebarStyle = {
    width: "220px",
    backgroundColor: "#2c3e50",
    color: "#ecf0f1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "1.5rem 1rem",
  };

  const logoStyle = {
    width: "80px",
    height: "80px",
    marginBottom: "1rem",
    objectFit: "contain",
  };

  const sidebarTitleStyle = {
    margin: "0 0 2rem 0",
    fontSize: "1.5rem",
    fontWeight: "bold",
  };

  const navStyle = {
    width: "100%",
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
    padding: "0.5rem",
    borderRadius: "4px",
    cursor: "pointer",
    textAlign: "center",
    transition: "background-color 0.2s ease",
  };

  const navListItemHoverStyle = {
    backgroundColor: "#34495e",
  };

  // Main content area
  const mainStyle = {
    flex: 1,
    padding: "2rem",
  };

  const headerStyle = {
    marginBottom: "1.5rem",
    fontSize: "2rem",
    color: "#333",
  };

  const groupListStyle = {
    listStyle: "none",
    padding: 0,
    margin: "0 0 1.5rem",
    maxWidth: "600px",
  };

  const groupItemStyle = {
    backgroundColor: "#fff",
    margin: "0.5rem 0",
    padding: "1rem",
    borderRadius: "6px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    fontSize: "1rem",
    color: "#555",
  };

  const noGroupsStyle = {
    fontStyle: "italic",
    color: "#777",
    marginBottom: "1.5rem",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#4a90e2",
    color: "#fff",
    transition: "background-color 0.3s ease",
  };

  // Hover states for nav items and button (optional)
  const [activeItem, setActiveItem] = useState(null); // for nav hover
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  return (
    <div style={dashboardContainer}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <img
        	style={logoStyle}
        	src={Logo}
  			alt="My Logo"
        />
        <h2 style={sidebarTitleStyle}>My Dashboard</h2>
        <nav style={navStyle}>
          <ul style={navListStyle}>
            {["Dashboard", "Settings", "Logout"].map((item, index) => (
              <li
                key={index}
                style={{
                  ...navListItemStyle,
                  ...(activeItem === index ? navListItemHoverStyle : {}),
                }}
                onMouseEnter={() => setActiveItem(index)}
                onMouseLeave={() => setActiveItem(null)}
              >
                {item}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={mainStyle}>
        <h1 style={headerStyle}>Your Groups</h1>
        {groups.length > 0 ? (
          <ul style={groupListStyle}>
            {groups.map((group) => (
              <li key={group.id} style={groupItemStyle}>
                {group.name}
              </li>
            ))}
          </ul>
        ) : (
          <p style={noGroupsStyle}>No groups found. Try adding one!</p>
        )}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: isButtonHovered ? "#357abD" : "#4a90e2",
          }}
          onClick={addGroup}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
        >
          Add Group
        </button>
      </main>
    </div>
  );
};

export default OrganizerHome;
