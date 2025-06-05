import React, { useState } from 'react';
import './VerticalNav.css';

const VerticalNav = ({ onNavigate, currentScene }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'entry', label: 'Main Entry', scene: 'ENTRY' },
    { id: 'room1', label: 'Office Room', scene: 'ROOM1' },
    { id: 'admin', label: 'Admin Block', scene: 'ADMIN-BLOCK' },
    { id: 'workspace', label: 'Work Space', scene: 'WORKSPACE' },
    { id: 'new-office', label: 'New Office', scene: 'NEW-OFFICE' },
    { id: 'new-office-inside', label: 'New Office Interior', scene: 'NEW-OFFICE-INSIDE' },
    { id: 'studio-outside', label: 'Studio Entrance', scene: 'STUDIO-OUTSIDE' },
    { id: 'studio', label: 'Studio', scene: 'STUDIO' },
  ];

  const handleClick = (item) => {
    if (typeof onNavigate === 'function') {
      onNavigate(item.scene);
    }
  };

  return (
    <div className={`nav-container ${isMenuOpen ? 'open' : ''}`}>
      <div className="nav-content">
        {!isMenuOpen && (
          <button 
            className="main-button explore"
            onClick={() => setIsMenuOpen(true)}
          >
            Explore
          </button>
        )}

        <div className="vertical-nav">
          <button
            className="nav-item exit-item"
            onClick={() => setIsMenuOpen(false)}
          >
            Exit
          </button>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentScene === item.scene ? 'active' : ''}`}
              onClick={() => handleClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VerticalNav; 