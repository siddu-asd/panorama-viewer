import React, { useState, useEffect, useRef } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import 'font-awesome/css/font-awesome.min.css';

const imageUrls = [
  '/360-1.jpg',
  '/360-2.jpg',
  '/image-1.jpg',
  '/image-2.jpg',
];

const preloadImages = (urls) => {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

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

const ViewerComponent = () => {
  const [navbarVisible, setNavbarVisible] = useState(true);
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const autorotateRef = useRef(null);

  useEffect(() => {
    preloadImages(imageUrls);

    const container = document.getElementById('app-viewer-container');

    const viewer = new Viewer({
      container,
      panorama: '/360-1.jpg',
      defaultZoomLvl: 30,
      navbar: navbarVisible,
      navbar: navbarVisible ? [
        'autorotate',
        'fullscreen',
         'markers-list',
        'markers',
       
      ] : false,
      transition: {
        duration: 1000,
        loader: false,
        blur: false,
        fade: true,
        zoom:false,
      },
      plugins: [
        [MarkersPlugin],
        [AutorotatePlugin, { speed: 0.5 }],
      ],
    });

    viewerRef.current = viewer;
    markersPluginRef.current = viewer.getPlugin(MarkersPlugin);
    autorotateRef.current = viewer.getPlugin(AutorotatePlugin);

    autorotateRef.current.start();

    addInitialMarkers();

    markersPluginRef.current.addEventListener('select-marker', handleMarkerClick);

    return () => viewer.destroy();
  }, [navbarVisible]);

  const handleMarkerClick = (e) => {
    const id = e.marker?.id;
    const viewer = viewerRef.current;

    const switchPanorama = async (url, addMarkersFn, animation) => {
      autorotateRef.current.stop();
      await viewer.setPanorama(url);
      addMarkersFn();
      viewer.animate(animation);
      autorotateRef.current.start();
    };

    switch (id) {
      case 'ROOM_1':
        switchPanorama('/360-3.jpg', addRoom1Markers, { yaw: 0.5, pitch: 0.2, zoom: 50 });
        break;
      case 'ROOM_2':
        switchPanorama('/image-1.jpg', addRoom2Markers, { yaw: -0.2, pitch: 0.1, zoom: 50 });
        break;
      case 'ROOM_1_DETAIL':
        switchPanorama('/image-2.jpg', addFinalRoomMarkers, { yaw: 0.8, pitch: 0.1, zoom: 50 });
        break;
      case 'BACK_TO_HOME':
        switchPanorama('/360-1.jpg', addInitialMarkers, { yaw: 0, pitch: 0, zoom: 30 });
        break;
      case 'BACK_TO_ROOM_1':
        switchPanorama('/360-2.jpg', addRoom1Markers, { yaw: 0.5, pitch: 0.2, zoom: 50 });
        break;
      default:
        break;
    }
  };

  const addInitialMarkers = () => {
    const markers = [
      {
        id: 'ROOM_1',
        position: { yaw: -2.65, pitch: -0.1 },
        html: createMarkerHTML('360-2.jpg'),
        tooltip: 'Room 1',
      },
      {
        id: 'ROOM_2',
        position: { yaw: -3.00, pitch: -0.1 },
        html: createMarkerHTML('image-2.jpg'),
        tooltip: 'Room 2',
      },
    ];
    setMarkers(markers);
  };

  const addRoom1Markers = () => {
    const markers = [
      {
        id: 'ROOM_1_DETAIL',
        position: { yaw: 2.7, pitch: -0.1 },
        html: createMarkerHTML('image-1.jpg'),
        tooltip: 'Room 1 Details',
      },
      {
        id: 'BACK_TO_HOME',
        position: { yaw: -1.9, pitch: -0.2 },
        html: createMarkerHTML('360-2.jpg'),
        tooltip: 'Back',
      },
    ];
    setMarkers(markers);
  };

  const addRoom2Markers = () => {
    const markers = [
      {
        id: 'ROOM_2_DETAIL',
        position: { yaw: -0.2, pitch: 0.1 },
        html: createMarkerHTML('360-1.jpg'),
        tooltip: 'Room 2 Details',
      },
      {
        id: 'BACK_TO_HOME',
        position: { yaw: 1.5, pitch: 0.0 },
        html: createMarkerHTML('360-1.jpg'),
        tooltip: 'Back',
      },
    ];
    setMarkers(markers);
  };

  const addFinalRoomMarkers = () => {
    const markers = [
      {
        id: 'ROOM_1_FINAL',
        position: { yaw: 0.8, pitch: 0.1 },
        html: createMarkerHTML('image-2.jpg'),
        tooltip: 'Room 1 Final View',
      },
      {
        id: 'BACK_TO_ROOM_1',
        position: { yaw: -1.5, pitch: 0.0 },
        html: createMarkerHTML('image-1.jpg'),
        tooltip: 'Back to Room 1',
      },
    ];
    setMarkers(markers);
  };

  const setMarkers = (markerArray) => {
    const plugin = markersPluginRef.current;
    plugin.clearMarkers();
    markerArray.forEach(marker => {
      plugin.addMarker({
        ...marker,
        anchor: 'center center',
      });
    });
  };

  const toggleNavbar = () => setNavbarVisible(prev => !prev);

  return (
    <div>
      {/* Logo at the top-left corner */}
      <img
        src="/LOGO.png" // Replace with your logo path
        alt="Logo"
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          height: '50px',
          zIndex: 1000,
        }}
      />

      {/* Button to toggle navbar visibility */}
      <button
        onClick={toggleNavbar}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '10px',
          backgroundColor: 'rgba(0, 123, 255, 0.4)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10,
          backdropFilter: 'blur(5px)', // Adds a blur effect behind the button
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', 
        }}
      >
        <i className={`fa ${navbarVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>

      {/* Viewer Container */}
      <div
        id="app-viewer-container"
        style={{ width: '100%', height: '100vh', overflow: 'hidden' }}
      />
    </div>
  );
};

export default ViewerComponent;
