import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/VerticalNav.css';

const VerticalNav = ({ onNavigate, currentScene, scenes, portalContainer }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('nav-open', isMenuOpen);
    if (isMenuOpen) {
      setTimeout(() => setModalVisible(true), 10);
    } else {
      setModalVisible(false);
    }
  }, [isMenuOpen]);

  // Simplified Navigation Categories
  const navigationCategories = [
    {
      id: 'main-areas',
      title: 'Main Areas',
      items: [
        { id: 'entry', label: 'Main Entry', scene: 'ENTRY',  image: './backToMainEntry.jpg'},
        { id: 'room1', label: 'Office Room', scene: 'ROOM1', image: './office.jpg' },
        { id: 'admin', label: 'Admin Block', scene: 'ADMIN-BLOCK', image: './adminblock.jpg' },
      ]
    },
    {
      id: 'workspaces',
      title: 'Workspaces',
      items: [
        { id: 'workspace', label: 'Work Space', scene: 'WORKSPACE', image: './workspace.jpg'},
        { id: 'new-office', label: 'New Office', scene: 'NEW-OFFICE', image: './newOffice.jpg'},
        { id: 'new-office-inside', label: 'New Office Interior', scene: 'NEW-OFFICE-INSIDE', image: './officeroom.jpg'},
      ]
    },
    {
      id: 'creative',
      title: 'Creative Spaces',
      items: [
        { id: 'studio-outside', label: 'Studio Entrance', scene: 'STUDIO-OUTSIDE', image: '/office-6.jpg' },
        { id: 'studio', label: 'Studio', scene: 'STUDIO', image: '/office-16.jpg' },
      ]
    }
  ];

  const handleClick = (item) => {
    setSelectedScene(item.scene);
  };

  const handleBack = () => {
    setSelectedScene(null);
  };

  const handleSceneNavigate = (scene) => {
    if (typeof onNavigate === 'function') {
      onNavigate(scene);
    }
    setIsMenuOpen(false);
    setSelectedScene(null);
  };

  // Simplified Modal Content
  let modalContent;
  if (selectedScene) {
    const sceneData = scenes[selectedScene];
    modalContent = (
      <div className="pmj-modal-content">
        <div className="pmj-modal-header">
          <button className="pmj-back-btn" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        </div>
        
        <div className="pmj-markers-grid">
          {sceneData?.markers?.map((marker, idx) => (
            <div
              key={marker.id}
              className="pmj-marker-card"
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => handleSceneNavigate(marker.target)}
            >
              <div className="pmj-marker-image">
                {marker.image && <img src={marker.image.replace('./', '/')} alt={marker.tooltip} />}
              </div>
              <div className="pmj-marker-content">
                <h4 className="pmj-marker-title">{marker.tooltip}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    modalContent = (
      <div className="pmj-modal-content">
        <div className="pmj-modal-header">
          <h2 className="pmj-modal-title">Explore</h2>
        </div>
        
        <div className="pmj-categories-grid">
          {navigationCategories.map((category, categoryIdx) => (
            <div key={category.id} className="pmj-category-section">
              <h3 className="pmj-category-title">{category.title}</h3>
              
              <div className="pmj-category-items">
                {category.items.map((item, itemIdx) => (
                  <button
                    key={item.id}
                    className={`pmj-nav-item ${currentScene === item.scene ? 'pmj-active' : ''}`}
                    style={{ animationDelay: `${(categoryIdx * 100) + (itemIdx * 50)}ms` }}
                    onClick={() => handleClick(item)}
                  >
                    <div className="pmj-item-image">
                      <img 
                        src={item.image} 
                        alt={item.label}
                        loading="eager"
                      />
                    </div>
                    <div className="pmj-item-content">
                      <span className="pmj-item-label">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const navMenu = isMenuOpen && portalContainer
    ? ReactDOM.createPortal(
        <div className="pmj-modal-overlay">
          <div className="pmj-modal-backdrop" onClick={() => { setIsMenuOpen(false); setSelectedScene(null); }}></div>
          <div className={`pmj-modal-container ${modalVisible ? 'pmj-show' : ''}`}>
            <button
              className="pmj-close-btn"
              onClick={() => { setIsMenuOpen(false); setSelectedScene(null); }}
              aria-label="Close navigation"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {modalContent}
          </div>
        </div>,
        portalContainer
      )
    : null;

  const exploreButton = !isMenuOpen && portalContainer && ReactDOM.createPortal(
    <button
      className="pmj-explore-btn"
      onClick={(e) => {
        e.stopPropagation();
        setIsMenuOpen(true);
        setSelectedScene(null);
      }}
      aria-label="Open navigation"
      aria-expanded={isMenuOpen}
    >
      <span className="pmj-explore-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <span className="pmj-explore-text">Explore</span>
    </button>,
    portalContainer
  );

  return (
    <>
      {exploreButton}
      {navMenu}
    </>
  );
};

export default VerticalNav;
