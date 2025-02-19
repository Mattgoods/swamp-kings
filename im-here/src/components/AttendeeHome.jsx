import React, { useState } from "react";
import Logo from "../assets/imherelogo-transparent.png";

const AttendeeHome = () => {
  // ======== Dummy event data (replace with real data) ========
  const [events, setEvents] = useState([
    { id: 1, name: "Event A" },
    { id: 2, name: "Event B" },
    { id: 3, name: "Event C" },
  ]);

  // ======== State for which main "page" is active ========
  // Possible values: "home", "profile"
  const [activePage, setActivePage] = useState("home");

  // ======== State for event details (when on "home") ========
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedView, setSelectedView] = useState(null);

  // ======== For double-click logout ========
  const [confirmLogout, setConfirmLogout] = useState(false);

  // ======== Show a message when "Check In" is clicked ========
  const [checkInMessage, setCheckInMessage] = useState("");

  // ======== Handlers for pages ========
  // Switch to Home page & reset event details and logout confirmation
  const goToHome = () => {
    setActivePage("home");
    setSelectedEvent(null);
    setSelectedView(null);
    setConfirmLogout(false);
    setCheckInMessage("");
  };

  // Switch to Profile page & reset
  const goToProfile = () => {
    setActivePage("profile");
    setSelectedEvent(null);
    setSelectedView(null);
    setConfirmLogout(false);
    setCheckInMessage("");
  };

  // Logout logic with double-click confirmation
  const handleLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true); // first click: ask for confirmation
    } else {
      // second click: redirect to Login page
      window.location.href = "/login";
    }
  };

  // When user clicks an event in the list
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setSelectedView(null);
    setCheckInMessage(""); // reset any previous check-in message
  };

  // Register for a new event (dummy)
  const registerForEvent = () => {
    const newEvent = {
      id: events.length + 1,
      name: `New Event ${events.length + 1}`,
    };
    setEvents([...events, newEvent]);
  };

  // Return to list of events from a selected event
  const handleBackToList = () => {
    setSelectedEvent(null);
    setSelectedView(null);
    setCheckInMessage("");
  };

  // Dummy "Check In" action
  const handleCheckIn = () => {
    if (selectedEvent) {
      setCheckInMessage(`You have checked in for "${selectedEvent.name}"!`);
    }
  };

  // ======== Styling (mirroring your OrganizerHome) ========
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
    cursor: "pointer",
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

  // Events list
  const eventListStyle = {
    listStyle: "none",
    padding: 0,
    margin: "0 0 1.5rem",
    maxWidth: "600px",
  };

  const eventItemStyle = {
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

  const eventItemHoverStyle = {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
  };

  const noEventsStyle = {
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

  // Hover states for nav items & events, etc.
  const [hoveredNavItemIndex, setHoveredNavItemIndex] = useState(null);
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [isPrimaryButtonHovered, setIsPrimaryButtonHovered] = useState(false);

  // Navigation items
  const navItems = [
    {
      label: "Home",
      value: "home",
      action: goToHome,
    },
    {
      label: "Profile",
      value: "profile",
      action: goToProfile,
    },
    {
      label: confirmLogout ? "Confirm Logout" : "Logout",
      value: "logout",
      action: handleLogout,
    },
  ];

  return (
    <div style={dashboardContainer}>
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <img style={logoStyle} src={Logo} alt="Attendee Logo" onClick={goToHome} />
        <h2 style={sidebarTitleStyle}>Attendee Dashboard</h2>

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
                    // Hover style if user is hovering over this item
                    ...(hoveredNavItemIndex === index ? navListItemHoverStyle : {}),
                    // Highlight if it's the current "page" (and not logout)
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
        {/* HOME PAGE ===================================== */}
        {activePage === "home" && (
          <>
            {/* If no event is selected, show the list of events */}
            {!selectedEvent && (
              <>
                <h1 style={headerStyle}>Your Events</h1>
                {events.length > 0 ? (
                  <ul style={eventListStyle}>
                    {events.map((event) => (
                      <li
                        key={event.id}
                        style={{
                          ...eventItemStyle,
                          ...(hoveredEventId === event.id
                            ? eventItemHoverStyle
                            : {}),
                        }}
                        onMouseEnter={() => setHoveredEventId(event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        onClick={() => handleEventClick(event)}
                      >
                        {event.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={noEventsStyle}>
                    No events found. Try registering for one!
                  </p>
                )}

                <button
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: isPrimaryButtonHovered ? "#357abD" : "#4a90e2",
                  }}
                  onClick={registerForEvent}
                  onMouseEnter={() => setIsPrimaryButtonHovered(true)}
                  onMouseLeave={() => setIsPrimaryButtonHovered(false)}
                >
                  Register for Event
                </button>
              </>
            )}

            {/* If an event is selected, show event details */}
            {selectedEvent && (
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
                  {selectedEvent.name}
                </h1>

                {/* Buttons for event actions */}
                <button
                  style={{ ...primaryButtonStyle, marginRight: "1rem" }}
                  onClick={() => setSelectedView("info")}
                >
                  Event Info
                </button>
                <button
                  style={{ ...primaryButtonStyle, backgroundColor: "#2ecc71" }}
                  onClick={() => setSelectedView("stats")}
                >
                  Event Stats
                </button>
                <button
                  style={{ ...primaryButtonStyle, backgroundColor: "#e67e22" }}
                  onClick={handleCheckIn}
                >
                  Check In
                </button>
                <button style={{ ...dangerButtonStyle }} onClick={handleBackToList}>
                  Back to Event List
                </button>

                {/* Sub-views */}
                {selectedView === "info" && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>
                      Information about {selectedEvent.name}
                    </h2>
                    <p style={{ color: "#555" }}>
                      Put event info here
                    </p>
                  </div>
                )}

                {selectedView === "stats" && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>
                      Stats for {selectedEvent.name}
                    </h2>
                    <p style={{ color: "#555" }}>
                      Show attendees or other event stats
                    </p>
                  </div>
                )}

                {/* If user clicked "Check In", show a success message */}
                {checkInMessage && (
                  <p style={{ marginTop: "1.5rem", color: "green" }}>
                    {checkInMessage}
                  </p>
                )}

                {/* If no specific sub-view is selected */}
                {!selectedView && !checkInMessage && (
                  <p style={{ marginTop: "1rem", color: "#555" }}>
                    Please select an option (Event Info / Event Stats) above or check in.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* PROFILE PAGE =============================== */}
        {activePage === "profile" && (
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
              Your Profile
            </h1>
            <p style={{ color: "#555" }}>
              Put Profile info here
            </p>
            <button
              style={{ ...dangerButtonStyle, marginTop: "1rem" }}
              onClick={goToHome}
            >
              Return to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AttendeeHome;
