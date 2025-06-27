import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './VerticalNav.css';

const VerticalNav = ({ onNavigate, currentScene, scenes }) => {
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
      <span className="explore-btn-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      Explore
    </button>,
    document.body
  );

  // Portal the nav menu to document.body when open
  const navMenu = isMenuOpen
    ? ReactDOM.createPortal(
        <div className="nav-modal-overlay">
          <div className="nav-modal-blur-bg">
            <div className="nav-modal animated-fade-in">
              <button
                className="modal-close-btn"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close navigation"
                type="button"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div className="nav-modal-grid">
                {navigationItems.map((item) => {
                  const sceneData = scenes?.[item.scene];
                  const image = sceneData?.panorama || '';
                  return (
                    <div key={item.id} className="nav-modal-card">
                      <div className="nav-modal-img-wrap">
                        {image && <img src={image.replace('./', '/')} alt={item.label} />}
                      </div>
                      <button
                        className={`nav-modal-btn${currentScene === item.scene ? ' active' : ''}`}
                        onClick={() => handleClick(item)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    </div>
                  );
                })}
              </div>
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
