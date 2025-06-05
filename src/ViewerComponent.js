import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import VerticalNav from './components/VerticalNav';

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
  const [currentScene, setCurrentScene] = useState('ENTRY');
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const autorotateRef = useRef(null);
  const [portalContainer, setPortalContainer] = useState(null);

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

  const handleNavigation = useCallback((target) => {
    if (target === 'exit') {
      if (window.confirm('Are you sure you want to exit?')) {
        window.location.href = '/';
      }
    } else {
      switchToScene(target);
      setCurrentScene(target);
    }
  }, [switchToScene]);

  useEffect(() => {
    const container = document.getElementById('app-viewer-container');
    const viewer = new Viewer({
      container,
      panorama: scenes.ENTRY.panorama,
      defaultZoomLvl: 30,
      navbar: ['fullscreen', 'autorotate'],
      plugins: [MarkersPlugin, [AutorotatePlugin, { autorotateSpeed: 0.5 }]],
    });

    // Logo overlay
    const logoOverlay = document.createElement('div');
    logoOverlay.className = 'psv-logo-overlay';
    logoOverlay.innerHTML = `<img src="/LOGO.png" alt="Logo" style="height: 50px; width: auto; padding: 10px;" />`;
    viewer.container.appendChild(logoOverlay);

    // Chatbot overlay
    const chatbotOverlay = document.createElement('div');
    chatbotOverlay.className = 'psv-chatbot-overlay';
    chatbotOverlay.innerHTML = `<img src="/nisaa.png" alt="Bot" style="width: 230px; height: 230px; object-fit: contain; cursor: pointer; transition: transform 0.3s ease-in-out;" />`;
    chatbotOverlay.onclick = toggleChatBot;
    viewer.container.appendChild(chatbotOverlay);

    // Navbar & overlay styling
    const style = document.createElement('style');
    style.textContent = `
      .psv-navbar {
        justify-content: flex-end !important;
        right: 10px;
        left: auto;
        gap: 10px;
        background: rgba(255, 255, 255, 0.1);
      }
      .psv-logo-overlay {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 100000;
        pointer-events: auto;
      }
      .psv-chatbot-overlay {
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 100000;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
      }
      .psv--fullscreen .psv-logo-overlay,
      .psv--fullscreen .psv-chatbot-overlay {
        position: fixed !important;
        z-index: 100000 !important;
      }
    `;
    document.head.appendChild(style);

    viewerRef.current = viewer;
    markersPluginRef.current = viewer.getPlugin(MarkersPlugin);
    autorotateRef.current = viewer.getPlugin(AutorotatePlugin);
    autorotateRef.current.start();
    setSceneMarkers(scenes.ENTRY.markers);

    markersPluginRef.current.addEventListener('select-marker', (e) => {
      document.querySelectorAll('.custom-marker').forEach((el) =>
        el.classList.remove('selected-marker')
      );
      if (e.marker?.domElement?.firstChild) {
        e.marker.domElement.firstChild.classList.add('selected-marker');
      }

      const target = Object.values(scenes)
        .flatMap((s) => s.markers)
        .find((m) => m.id === e.marker.id)?.target;
      if (target) switchToScene(target);
    });

    setPortalContainer(viewer.container);

    return () => {
      style.remove();
      viewer.destroy();
    };
  }, [setSceneMarkers, switchToScene, toggleChatBot]);

  return (
    <div>
      <style>{`
        .custom-marker {
          pointer-events: auto;
          cursor: pointer;
          padding:16px;
          width: 70px;
          height: 40px;
          border-radius: 4px;
          background-size: cover;
          background-position: center;
          background-color: white;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: pulseGlow 2s infinite;
        }
        .custom-marker::after {
          content: '';
          position: absolute;
          top: 0px;
          left: 0px;
          right: 0px;
          bottom: 0px;
          border: 0 solid transparent;
          border-radius: 4px;
          transition: all 0.3s ease;
          pointer-events: none;
        }
          
        .custom-marker:hover::after {
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border: 4px solid rgba(109, 34, 44, 0.6);
          border-radius: 10px;
        }
        .custom-marker:hover {
          transform: scale(1.4);
          box-shadow: 0 0 14px rgba(109, 34, 44, 0.4);
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 16px rgba(109, 34, 44, 0.4); }
          100% { box-shadow: 0 0 10px rgba(255,255,255,0.4); }
        }
        .custom-marker.selected-marker::before {
          content: '';
          position: absolute;
          top: -16px;
          left: -16px;
          right: -16px;
          bottom: -16px;
          border: 3px solid rgba(109, 34, 44, 0.6);
          border-radius: 12px;
          box-shadow: 0 0 12px rgba(109, 34, 44, 0.4);
          transition: all 0.4s ease;
          pointer-events: none;
          z-index: -1;
        }
      `}</style>

      <div
        id="app-viewer-container"
        style={{
          width: '100%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      />

      {portalContainer &&
        ReactDOM.createPortal(
          <VerticalNav onNavigate={handleNavigation} currentScene={currentScene} />,
          portalContainer
        )}
    </div>
  );
};

export default ViewerComponent;
