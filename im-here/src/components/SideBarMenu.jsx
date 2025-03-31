import React, { useState } from 'react';
import './SidebarMenu.css'; // TODO: Create CSS file for sidebar styling

const menuItems = [
  { id: 1, label: 'Home', icon: '🏠' },
  { id: 2, label: 'Map', icon: '🗺️' },
  { id: 3, label: 'Settings', icon: '⚙️' },
  // TODO: Add more menu items as needed
];

const SidebarMenu = ({ onSelect }) => {
  const [activeItem, setActiveItem] = useState(null);

  const handleSelect = (item) => {
    setActiveItem(item.id);
    if (onSelect) onSelect(item);
    // TODO: Maybe add routing logic here
    console.log('Selected item:', item.label);
  };

  return (
    <div className="sidebar">
      <h3 className="sidebar-title">My App</h3>
      <ul className="menu-list">
        {menuItems.map((item) => (
          <li
            key={item.id}
            className={`menu-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => handleSelect(item)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </li>
        ))}
      </ul>

      {/* TODO: Add logout button */}
      {/* TODO: Add user avatar or name */}
    </div>
  );
};

export default SidebarMenu;
