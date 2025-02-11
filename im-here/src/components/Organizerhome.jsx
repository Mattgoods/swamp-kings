import React, { useState } from "react";
import "./OrganizerHome.css"; // Ensure you have corresponding CSS file

const OrganizerHome = () => {
  // Dummy state for groups (replace with API data later)
  const [groups, setGroups] = useState([
    { id: 1, name: "Group A" },
    { id: 2, name: "Group B" },
    { id: 3, name: "Group C" },
  ]);

  // Function to add a new group (dummy implementation)
  const addGroup = () => {
    const newGroup = { id: groups.length + 1, name: `New Group ${groups.length + 1}` };
    setGroups([...groups, newGroup]);
  };

  return (
    <div className="organizer-home">
      <h1 className="title">Your Groups</h1>
      {groups.length > 0 ? (
        <ul className="group-list">
          {groups.map((group) => (
            <li key={group.id} className="group-item">{group.name}</li>
          ))}
        </ul>
      ) : (
        <p className="no-groups">No groups found. Try adding one!</p>
      )}
      <button className="add-group-btn" onClick={addGroup}>Add Group</button>
    </div>
  );
};

export default OrganizerHome;
