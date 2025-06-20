import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './VerticalNav.css';

const VerticalNav = ({ onNavigate, currentScene }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('nav-open', isMenuOpen);
  }, [isMenuOpen]);

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
    setIsMenuOpen(false); // Auto close menu on navigation
  };

  // Portal the Explore button to document.body so it's always on top
  const exploreButton = !isMenuOpen && ReactDOM.createPortal(
    <button
      className="main-button"
      onClick={(e) => {
        e.stopPropagation();
        setIsMenuOpen(true);
      }}
      aria-label="Open navigation"
      aria-expanded={isMenuOpen}
      type="button"
    >
      Explore
    </button>,
    document.body
  );

  // Portal the nav menu to document.body when open
  const navMenu = isMenuOpen
    ? ReactDOM.createPortal(
        <div className={`nav-container open`}>
          <div className="nav-content">
            <div className="vertical-nav">
              {/* Exit Button */}
              <button
                className="nav-item exit-item"
                onClick={() => setIsMenuOpen(false)}
                type="button"
              >
                Exit
              </button>

              {/* Navigation Items */}
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item${currentScene === item.scene ? ' active' : ''}`}
                  onClick={() => handleClick(item)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {exploreButton}
      {navMenu}
    </>
  );
};

export default VerticalNav;
