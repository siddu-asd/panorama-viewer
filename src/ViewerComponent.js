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
    viewer.hotspot.add({
      id: 'hotspot1',
      latitude: 10,  // Latitude (in degrees)
      longitude: 20, // Longitude (in degrees)
      title: 'Hotspot 1', // Hotspot title
      content: 'This is a hotspot', // Content of the popup
      onClick: () => {
        alert('Hotspot 1 clicked!');
      },
    });

    // Add another hotspot
    viewer.hotspot.add({
      id: 'hotspot2',
      latitude: -20,
      longitude: 40,
      title: 'Hotspot 2',
      content: 'Another hotspot',
      onClick: () => {
        alert('Second hotspot clicked!');
      },
    });

    // Clean up the viewer when the component is unmounted
    return () => {
      viewer.destroy();
    };
  }, []);

  return (
    <div 
      id="app-viewer-container" 
      style={{ width: '100%', height: '100vh' }} // Ensure the viewer takes full viewport height
    >
      {/* This div will hold the 360-degree viewer */}
    </div>
  );
};

export default ViewerComponent;
