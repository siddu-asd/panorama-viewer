import React, { useEffect, useRef, useCallback } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

const scenes = {
  ENTRY: {
    panorama: './office-15.jpg',
    markers: [
      { id: 'TO-ROOM1', image: './office-10.jpg', tooltip: 'Enter into the office', position: { yaw: -3.0, pitch: -0.15 }, target: 'ROOM1' },
      { id: 'TO-STUDIO-OUTSIDE', image: './office-6.jpg', tooltip: 'Go to Studio', position: { yaw: -2.0, pitch: -0.1 }, target: 'STUDIO-OUTSIDE' },
      { id: 'TO-NEW-OFFICE', image: './office-11.jpg', tooltip: 'Enter New Office', position: { yaw: 1.5, pitch: 0.2 }, target: 'NEW-OFFICE' },
    ],
  },
  ROOM1: {
    panorama: './office-10.jpg',
    markers: [
      { id: 'TO-ADMIN-BLOCK', image: './office-14.jpg', tooltip: 'See Workspace', position: { yaw: 2.5, pitch: -0.1 }, target: 'ADMIN-BLOCK' },
      { id: 'ROOM1-BACK', image: './office-15.jpg', tooltip: 'Back', position: { yaw: -0.6, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'ADMIN-BLOCK': {
    panorama: './office-14.jpg',
    markers: [
      { id: 'TO-MEETING-ROOM', image: './office-7.jpg', tooltip: 'Meeting Room', position: { yaw: -0.7, pitch: -0.1 }, target: 'MEETING-ROOM' },
      { id: 'TO-WORKSPACE-FROM-ADMIN', image: './office-7.jpg', tooltip: 'Work-space', position: { yaw: -0.4, pitch: 0.1 }, target: 'WORKSPACE' },
      { id: 'ADMIN-BLOCK-BACK', image: './office-10.jpg', tooltip: 'Back', position: { yaw: 2.6, pitch: -0.1 }, target: 'ROOM1' },
    ],
  },
  'MEETING-ROOM': {
    panorama: './office-7.jpg',
    markers: [
      { id: 'MEETING-BACK', image: './office-14.jpg', tooltip: 'Back to Admin Block', position: { yaw: -0.95, pitch: -0.25 }, target: 'ADMIN-BLOCK' },
    ],
  },
  'WORKSPACE': {
    panorama: './office-2.jpg',
    markers: [
      { id: 'WORKSPACE-BACK', image: './office-14.jpg', tooltip: 'Back to Admin Block', position: { yaw: -2.5, pitch: -0.1 }, target: 'ADMIN-BLOCK' },
    ],
  },
  'NEW-OFFICE': {
    panorama: './office-11.jpg',
    markers: [
      { id: 'TO-NEW-OFFICE-INSIDE', image: './office-12.jpg', tooltip: 'See New Office', position: { yaw: -0.2, pitch: 0.1 }, target: 'NEW-OFFICE-INSIDE' },
      { id: 'NEW-OFFICE-BACK', image: './office-15.jpg', tooltip: 'Back', position: { yaw: 1.5, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'NEW-OFFICE-INSIDE': {
    panorama: './office-12.jpg',
    markers: [
      { id: 'NEW-OFFICE-INSIDE-BACK', image: './office-11.jpg', tooltip: 'Back to Office', position: { yaw: -3.55, pitch: -0.1 }, target: 'NEW-OFFICE' },
    ],
  },
  'STUDIO-OUTSIDE': {
    panorama: './office-6.jpg',
    markers: [
      { id: 'TO-STUDIO', image: './office-1.jpg', tooltip: 'Enter Studio', position: { yaw: 1.9, pitch: 0.05 }, target: 'STUDIO' },
      { id: 'STUDIO-OUTSIDE-BACK', image: './office-15.jpg', tooltip: 'Back to Entry', position: { yaw: -0.6, pitch: 0.05 }, target: 'ENTRY' },
    ],
  },
  'STUDIO': {
    panorama: './office-16.jpg',
    markers: [
      { id: 'STUDIO-BACK', image: './office-6.jpg', tooltip: 'Back to Studio Outside', position: { yaw: -2.19, pitch: -0.18 }, target: 'STUDIO-OUTSIDE' },
    ],
  },
};

const ViewerComponent = ({ toggleChatBot }) => {
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const autorotateRef = useRef(null);

  const setSceneMarkers = useCallback((markerList) => {
    const plugin = markersPluginRef.current;
    plugin.clearMarkers();
    markerList.forEach(({ id, position, image, tooltip }) => {
      plugin.addMarker({
        id,
        position,
        tooltip,
        html: `<div class="custom-marker" style="background-image: url('${image}');"></div>`,
        anchor: 'center center',
      });
    });
  }, []);

  const switchToScene = useCallback(async (sceneId) => {
    const scene = scenes[sceneId];
    if (!scene) return;
    autorotateRef.current.stop();
    await viewerRef.current.setPanorama(scene.panorama);
    setSceneMarkers(scene.markers);
    autorotateRef.current.start();
  }, [setSceneMarkers]);

  useEffect(() => {
    const container = document.getElementById('app-viewer-container');
    const viewer = new Viewer({
      container,
      panorama: scenes.ENTRY.panorama,
      defaultZoomLvl: 30,
      navbar: [
        'autorotate',
        'zoom',
        'move',
        'download',
        'description',
        'caption',
        'fullscreen',
      ],
      plugins: [
        MarkersPlugin,
        [AutorotatePlugin, { autorotateSpeed: 0.5 }],
      ],
    });

    viewerRef.current = viewer;
    markersPluginRef.current = viewer.getPlugin(MarkersPlugin);
    autorotateRef.current = viewer.getPlugin(AutorotatePlugin);
    autorotateRef.current.start();
    setSceneMarkers(scenes.ENTRY.markers);

    markersPluginRef.current.addEventListener('select-marker', (e) => {
      const target = Object.values(scenes).flatMap(s => s.markers).find(m => m.id === e.marker.id)?.target;
      if (target) switchToScene(target);
    });

    return () => {
      viewer.destroy();
    };
  }, [setSceneMarkers, switchToScene]);

  return (
    <div>
      <style>
        {`
          .custom-marker {
            pointer-events: auto;
            cursor: pointer;
            width: 70px;
            height: 40px;
            border-radius: 12px;
            background-size: cover;
            background-position: center;
            animation: pulseGlow 2s infinite;
          }
          .custom-marker:hover {
            transform: scale(1.4);
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
            50% { box-shadow: 0 0 20px rgba(0,123,255,0.7); }
            100% { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
          }
        `}
      </style>

      <img
        src="/LOGO.png"
        alt="Logo"
        style={{ position: 'fixed', top: '10px', left: '10px', height: '50px', zIndex: 1000 }}
      />

      <button
        onClick={toggleChatBot}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 10,
          border: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          width: '230px',
          height: '230px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/nisaa.png"
          alt="Bot"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: 'transparent',
            transition: 'transform 0.3s ease-in-out',
          }}
        />
      </button>

      <div id="app-viewer-container" style={{ 
        width: '100%', 
        height: '100vh', 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0 
      }} />
    </div>
  );
};

export default ViewerComponent;