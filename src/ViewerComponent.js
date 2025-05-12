import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import 'font-awesome/css/font-awesome.min.css';

// Image URLs to preload
const imageUrls = [
  '/360-1.jpg', '/360-2.jpg', '/image-1.jpg', '/image-2.jpg',
  '/office-1.jpg', '/office-10.jpg', '/office-14.jpg', '/office-15.jpg',
  '/office-7.jpg', '/office-6.jpg', '/office-16.jpg', '/office-2.jpg',
  '/office-11.jpg', '/office-12.jpg',
];

// Preload all images
const preloadImages = (urls) => {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

// Enhanced marker HTML
const createMarkerHTML = (imageUrl) => `
  <div class="custom-marker" style="background-image: url('${imageUrl}');"></div>
`;

// Scene configuration
const scenes = {
  ENTRY: {
    panorama: '/office-15.jpg',
    markers: [
      { id: 'TO-ROOM1', image: 'office-10.jpg', tooltip: 'Enter into the office', position: {yaw: -3.0, pitch: -0.15 }, target: 'ROOM1' },
      { id: 'TO-STUDIO-OUTSIDE', image: 'office-6.jpg', tooltip: 'Go to Studio', position: {  yaw: -2.0, pitch: -0.1  }, target: 'STUDIO-OUTSIDE' },
      { id: 'TO-NEW-OFFICE', image: 'office-11.jpg', tooltip: 'Enter New Office', position: { yaw: 1.5, pitch: 0.2}, target: 'NEW-OFFICE' },
    ],
  },
  ROOM1: {
    panorama: '/office-10.jpg',
    markers: [
      { id: 'TO-ADMIN-BLOCK', image: 'office-14.jpg', tooltip: 'See Workspace', position: { yaw: 2.5, pitch: -0.1 }, target: 'ADMIN-BLOCK' },
      { id: 'ROOM1-BACK', image: 'office-15.jpg', tooltip: 'Back', position: { yaw: -0.6, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'ADMIN-BLOCK': {
    panorama: '/office-14.jpg',
    markers: [
      { id: 'TO-MEETING-ROOM', image: 'office-7.jpg', tooltip: 'Meeting Room', position: { yaw: -0.7, pitch: -0.1 }, target: 'MEETING-ROOM' },
      { id: 'TO-WORKSPACE-FROM-ADMIN', image: 'office-7.jpg', tooltip: 'Work-space', position: { yaw: -0.4, pitch: 0.1 }, target: 'WORKSPACE' },
      { id: 'ADMIN-BLOCK-BACK', image: 'office-10.jpg', tooltip: 'Back', position: {yaw: 2.6, pitch: -0.1}, target: 'ROOM1' },
    ],
  },
  'MEETING-ROOM': {
    panorama: '/office-7.jpg',
    markers: [
      { id: 'MEETING-BACK', image: 'office-14.jpg', tooltip: 'Back to Admin Block', position: { yaw: -0.95, pitch: -0.25 }, target: 'ADMIN-BLOCK' },
    ],
  },
  'WORKSPACE': {
    panorama: '/office-2.jpg',
    markers: [
      { id: 'WORKSPACE-BACK', image: 'office-14.jpg', tooltip: 'Back to Admin Block', position: { yaw: -2.5, pitch: -0.1 }, target: 'ADMIN-BLOCK' },
    ],
  },
  'NEW-OFFICE': {
    panorama: '/office-11.jpg',
    markers: [
      { id: 'TO-NEW-OFFICE-INSIDE', image: 'office-12.jpg', tooltip: 'See New Office', position: { yaw: -0.2, pitch: 0.1 }, target: 'NEW-OFFICE-INSIDE' },
      { id: 'NEW-OFFICE-BACK', image: 'office-15.jpg', tooltip: 'Back', position: { yaw: 1.5, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'NEW-OFFICE-INSIDE': {
    panorama: '/office-12.jpg',
    markers: [
      { id: 'NEW-OFFICE-INSIDE-BACK', image: 'office-11.jpg', tooltip: 'Back to  Office', position: { yaw: -3.55, pitch: -0.1 }, target: 'NEW-OFFICE' },
    ],
  },
  'STUDIO-OUTSIDE': {
    panorama: '/office-6.jpg',
    markers: [
      { id: 'TO-STUDIO', image: 'office-1.jpg', tooltip: 'Enter Studio', position: { yaw: 1.9, pitch: 0.05 }, target: 'STUDIO' },
      { id: 'STUDIO-OUTSIDE-BACK', image: 'office-15.jpg', tooltip: 'Back to Entry', position: { yaw: -0.6, pitch: 0.05 }, target: 'ENTRY' },
    ],
  },
  'STUDIO': {
    panorama: '/office-16.jpg',
    markers: [
      { id: 'STUDIO-BACK', image: 'office-6.jpg', tooltip: 'Back to Studio Outside', position: { yaw: -2.19, pitch: -0.18}, target: 'STUDIO-OUTSIDE' },
    ],
  },
};

const ViewerComponent = () => {
  const [navbarVisible, setNavbarVisible] = useState(true);
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const autorotateRef = useRef(null);

  const handleMarkerClick = useCallback((e) => {
    const markerId = e.marker.id;
    const allMarkers = Object.values(scenes).flatMap(s => s.markers);
    const found = allMarkers.find(m => m.id === markerId);
    if (found?.target) switchToScene(found.target);
  }, []);

  useEffect(() => {
    preloadImages(imageUrls);
    const container = document.getElementById('app-viewer-container');
    const viewer = new Viewer({
      container,
      panorama: scenes.ENTRY.panorama,
      defaultZoomLvl: 30,
      minFov: 30,
      maxFov: 90,
      navbar: navbarVisible ? ['autorotate', 'fullscreen', 'markers-list', 'markers'] : false,
      transition: { duration: 1000, loader: false, blur: false, fade: true, zoom: false },
      plugins: [
        [MarkersPlugin],
        [AutorotatePlugin, { speed: 0.5 }],
      ],
    });

    viewerRef.current = viewer;
    markersPluginRef.current = viewer.getPlugin(MarkersPlugin);
    autorotateRef.current = viewer.getPlugin(AutorotatePlugin);

    autorotateRef.current.start();
    setSceneMarkers(scenes.ENTRY.markers);

    markersPluginRef.current.addEventListener('select-marker', handleMarkerClick);

    return () => viewer.destroy();
  }, [navbarVisible, handleMarkerClick]);

  const switchToScene = async (sceneId) => {
    const scene = scenes[sceneId];
    if (!scene) return;

    autorotateRef.current.stop();
    await viewerRef.current.setPanorama(scene.panorama);
    setSceneMarkers(scene.markers);
    autorotateRef.current.start();
  };

  const setSceneMarkers = (markerList) => {
    const plugin = markersPluginRef.current;
    plugin.clearMarkers();
    markerList.forEach(({ id, position, image, tooltip }) => {
      plugin.addMarker({
        id,
        position,
        tooltip,
        html: createMarkerHTML(image),
        anchor: 'center center',
      });
    });
  };

  return (
    <div>
      <style>{`
        .custom-marker {
          pointer-events: auto;
          cursor: pointer;
          width: 70px;
          height: 40px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
          box-shadow: 0 0 12px rgba(255, 255, 255, 0.5), 0 0 20px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.8);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: pulseGlow 2s infinite ease-in-out;
        }

        .custom-marker:hover {
          transform: scale(1.4);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.9), 0 0 30px rgba(0, 123, 255, 0.6);
        }

        @keyframes pulseGlow {
          0% { box-shadow: 0 0 12px rgba(255, 255, 255, 0.4); }
          50% { box-shadow: 0 0 20px rgba(0, 123, 255, 0.6); }
          100% { box-shadow: 0 0 12px rgba(255, 255, 255, 0.4); }
        }
      `}</style>

      <img
        src="/LOGO.png"
        alt="Logo"
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          height: '50px',
          zIndex: 1000,
        }}
      />
      <button
        onClick={() => setNavbarVisible(prev => !prev)}
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
          backdropFilter: 'blur(5px)',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <i className={`fa ${navbarVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>
      <div id="app-viewer-container" style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />
    </div>
  );
};

export default ViewerComponent;
