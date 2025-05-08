import React, { useState, useEffect } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import 'font-awesome/css/font-awesome.min.css';

const ViewerComponent = () => {
  const [navbarVisible, setNavbarVisible] = useState(true);

  useEffect(() => {
    const container = document.getElementById('app-viewer-container');

    const viewer = new Viewer({
      container,
      panorama: '/360-1.jpg',
      navbar: navbarVisible,
      defaultZoomLvl: 30,
      plugins: [
        [MarkersPlugin],
        [AutorotatePlugin, { speed: 0.5 }],
      ],
    });

    const autorotate = viewer.getPlugin(AutorotatePlugin);
    autorotate.start();

    const markersPlugin = viewer.getPlugin(MarkersPlugin);

    const createMarkerHTML = (imageUrl) => `
      <div style="
        pointer-events: auto;
        cursor: pointer;
        width: 60px;
        height: 30px;
        background-image: url('${imageUrl}');
        background-size: cover;
        border: 1px solid white;
        outline: 1px solid white;
        animation: blink 1s infinite;
        transition: transform 0.3s ease-in-out;"
        onmouseover="this.style.transform='scale(1.5)'"
        onmouseout="this.style.transform='scale(1)'"
      ></div>
    `;

    const addInitialMarkers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_1',
        position: { yaw: -2.65, pitch: -0.1 },
        html: createMarkerHTML('360-2.jpg'),
        anchor: 'center center',
        tooltip: 'Room 1',
      });

      markersPlugin.addMarker({
        id: 'ROOM_2',
        position: { yaw: -3.00, pitch: -0.1 },
        html: createMarkerHTML('image-2.jpg'),
        anchor: 'center center',
        tooltip: 'Room 2',
      });
    };

    const addRoom1Markers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_1_DETAIL',
        position: { yaw: 2.7, pitch: -0.1 },
        html: createMarkerHTML('image-1.jpg'),
        anchor: 'center center',
        tooltip: 'Room 1 Details',
      });

      markersPlugin.addMarker({
        id: 'BACK_TO_HOME',
        position: { yaw: -1.9, pitch: -0.2 },
        html: createMarkerHTML('360-2.jpg'),
        anchor: 'center center',
        tooltip: 'Back',
      });
    };

    const addRoom2Markers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_2_DETAIL',
        position: { yaw: -0.2, pitch: 0.1 },
        html: createMarkerHTML('360-1.jpg'),
        anchor: 'center center',
        tooltip: 'Room 2 Details',
      });

      markersPlugin.addMarker({
        id: 'BACK_TO_HOME',
        position: { yaw: 1.5, pitch: 0.0 },
        html: createMarkerHTML('360-1.jpg'),
        anchor: 'center center',
        tooltip: 'Back',
      });
    };

    const addFinalRoomMarkers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_1_FINAL',
        position: { yaw: 0.8, pitch: 0.1 },
        html: createMarkerHTML('image-2.jpg'),
        anchor: 'center center',
        tooltip: 'Room 1 Final View',
      });

      markersPlugin.addMarker({
        id: 'BACK_TO_ROOM_1',
        position: { yaw: -1.5, pitch: 0.0 },
        html: createMarkerHTML('image-1.jpg'),
        anchor: 'center center',
        tooltip: 'Back to Room 1',
      });
    };

    addInitialMarkers();

    markersPlugin.addEventListener('select-marker', (e) => {
      const markerId = e.marker?.id;
      console.log('Clicked marker:', markerId);

      switch (markerId) {
        case 'ROOM_1':
          viewer.setPanorama('/360-2.jpg').then(() => {
            addRoom1Markers();
            viewer.animate({ yaw: 0.5, pitch: 0.2, zoom: 50 });
          });
          break;

        case 'ROOM_2':
          viewer.setPanorama('/image-1.jpg').then(() => {
            addRoom2Markers();
            viewer.animate({ yaw: -0.2, pitch: 0.1, zoom: 50 });
          });
          break;

        case 'ROOM_1_DETAIL':
          viewer.setPanorama('/image-2.jpg').then(() => {
            addFinalRoomMarkers();
            viewer.animate({ yaw: 0.8, pitch: 0.1, zoom: 50 });
          });
          break;

        case 'BACK_TO_HOME':
          viewer.setPanorama('/360-1.jpg').then(() => {
            addInitialMarkers();
            viewer.animate({ yaw: 0, pitch: 0, zoom: 30 });
          });
          break;

        case 'BACK_TO_ROOM_1':
          viewer.setPanorama('/360-2.jpg').then(() => {
            addRoom1Markers();
            viewer.animate({ yaw: 0.5, pitch: 0.2, zoom: 50 });
          });
          break;

        default:
          break;
      }
    });

    return () => viewer.destroy();
  }, [navbarVisible]);

  const toggleNavbar = () => {
    setNavbarVisible((prev) => !prev);
  };

  return (
    <div>
      <button
        onClick={toggleNavbar}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        <i className={`fa ${navbarVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>

      <div
        id="app-viewer-container"
        style={{ width: '100%', height: '100vh', overflow: 'hidden' }}
      />
    </div>
  );
};

export default ViewerComponent;
