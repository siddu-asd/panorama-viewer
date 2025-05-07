import React, { useEffect } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import image1 from './assets/image-1.jpg';  // Import the image from the 'src/assets' folder

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

const ViewerComponent = () => {
  useEffect(() => {
    const viewer = new Viewer({
      container: 'app-viewer-container',
      panorama: '/360-2.jpg', // Initial panorama (this image is also assumed to be in public)
      navbar: false,
      plugins: [
        [MarkersPlugin],
      ],
    });

    // Get the Markers plugin
    const markersPlugin = viewer.getPlugin(MarkersPlugin);

    // Add a marker
    markersPlugin?.addMarker({
      id: 'BALCONY',
      position: { yaw: 0.3, pitch: 0.1 }, // Adjust position as needed
      html: `<img src="${image1}" alt="Balcony" style="width: 40px; height: 40px; border: 2px solid white;" />`, 
      anchor: 'center center',
      tooltip: 'BALCONY',
      onClick: () => {
        console.log("Marker clicked, zooming in...");

        // Zoom into the marker position
        viewer.zoomTo(4, { yaw: 0.3, pitch: 0.1 }).then(() => {
          console.log("Zoom completed. Changing panorama...");

          // After zooming, change the panorama
          viewer.setPanorama('/360-1.jpg').then(() => {
            console.log("Panorama changed successfully");
          }).catch((err) => {
            console.error("Error changing panorama:", err);
          });
        }).catch((err) => {
          console.error('Error during zoom:', err);
        });
      }
    });

    // Cleanup on component unmount
    return () => viewer.destroy();
  }, []);

  return (
    <div
      id="app-viewer-container"
      style={{ width: '100%', height: '100vh', overflow: 'hidden' }}
    />
  );
};

export default ViewerComponent;
