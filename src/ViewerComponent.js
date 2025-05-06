import React, { useEffect } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css'; // Correct import for CSS

const ViewerComponent = () => {
  useEffect(() => {
    // Initialize the PhotoSphereViewer once the component is mounted
    const viewer = new Viewer({
      container: 'app-viewer-container', // The ID of the container where the viewer will be rendered
      panorama: '/360-2.jpg', // Path to the 360-degree image (ensure this is correct)
      navbar: false, // Disable the navbar (optional)
      autoRotate: true, // Enables auto-rotation
      autoRotateDelay: 5000, // Delay before auto-rotation starts (in ms)
      autoRotateSpeed: 0.1, // Speed of auto-rotation (positive values rotate counter-clockwise, negative values clockwise)
    });

    // Log to ensure the viewer is initialized correctly
    console.log(viewer);

    // Add a hotspot at a specific position (latitude and longitude)
    
    // Clean up the viewer when the component is unmounted
    return () => {
      viewer.destroy();
    };
  }, []);

  return (
    <div 
      id="app-viewer-container" 
      style={{ width: '100%', height: '100vh',overflow:'hidden' }} // Ensure the viewer takes full viewport height
    >
      {/* This div will hold the 360-degree viewer */}
    </div>
  );
};

export default ViewerComponent;
