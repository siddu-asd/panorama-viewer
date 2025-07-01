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
        html: `
          <div class="custom-marker-card">
            <div class="custom-marker-img" style="background-image: url('${image}');"></div>
            <div class="custom-marker-label">${tooltip}</div>
          </div>
        `,
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
      navbar: ['autorotate','fullscreen'],
      plugins: [MarkersPlugin, [AutorotatePlugin, { autorotateSpeed: 0.1 }]],
    });

    const logoOverlay = document.createElement('div');
    logoOverlay.className = 'psv-logo-overlay';
    logoOverlay.innerHTML = `<img class="responsive-logo" src="/LOGO.png" alt="Logo" />`;
    viewer.container.appendChild(logoOverlay);

    const chatbotOverlay = document.createElement('div');
    chatbotOverlay.className = 'psv-chatbot-overlay';
    chatbotOverlay.innerHTML = `<img id="psv-chatbot-img" src="/nisaa.png" alt="Bot" style="width: 320px; height: 280px; object-fit: contain; cursor: pointer; transition: transform 0.3s ease-in-out;" />`;
    const chatbotImg = chatbotOverlay.querySelector('#psv-chatbot-img');
    if (chatbotImg) {
      chatbotImg.onclick = toggleChatBot;
      chatbotImg.addEventListener('touchstart', toggleChatBot);
    }
    viewer.container.appendChild(chatbotOverlay);

    const style = document.createElement('style');
    style.textContent = `
      .psv-navbar {
        position: fixed !important;
        left: 24px !important;
        bottom: 32px !important;
        top: auto !important;
        right: auto !important;
        transform: none !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        align-items: flex-start !important;
        gap: 18px !important;
        background: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
      }
      .psv-button {
        width: 48px !important;
        height: 48px !important;
        border-radius: 50% !important;
        background: rgba(255,255,255,0.18) !important;
        box-shadow: 0 2px 12px rgba(107, 70, 193, 0.12);
        display: flex !important;
        align-items: center;
        justify-content: center;
        border: none !important;
        margin: 0 0 12px 0 !important;
        transition: background 0.18s, box-shadow 0.18s, transform 0.14s;
        color: #6B46C1 !important;
        font-size: 22px !important;
        filter: none !important;
      }
      .psv-button:last-child {
        margin-bottom: 0 !important;
      }
      .psv-button svg {
        width: 28px !important;
        height: 28px !important;
      }
      .psv-button:hover {
        background: #6B46C1 !important;
        color: #fff !important;
        box-shadow: 0 4px 24px rgba(107, 70, 193, 0.22);
        transform: scale(1.08);
      }
      /* Hide menu button if present */
      .psv-menu-button {
        display: none !important;
      }
      @media (max-width: 768px) {
        .psv-navbar {
          left: 4px !important;
          bottom: 4px !important;
          gap: 10px !important;
        }
        .psv-button {
          width: 40px !important;
          height: 40px !important;
        }
        .psv-button svg {
          width: 22px !important;
          height: 22px !important;
        }
      }
      @media (max-width: 480px) {
        .psv-navbar {
          left: 2vw !important;
          bottom: 2vw !important;
          gap: 8px !important;
        }
        .psv-button {
          width: 32px !important;
          height: 32px !important;
        }
        .psv-button svg {
          width: 16px !important;
          height: 16px !important;
        }
      }
      .psv-logo-overlay {
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 100000;
        pointer-events: auto;
      }
      .responsive-logo {
        height: 50px;
        width: auto;
        padding: 10px;
      }
      .psv-chatbot-overlay {
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 100001;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        pointer-events: auto !important;
        width: auto;
        height: auto;
        display: flex;
        align-items: flex-end;
        justify-content: flex-end;
      }
      .psv-chatbot-overlay img {
        pointer-events: auto !important;
        width: 220px !important;
        height: 220px !important;
        padding: 0;
        margin: 0;
        object-fit: contain;
        display: block;
      }
      .psv--fullscreen .psv-logo-overlay,
      .psv--fullscreen .psv-chatbot-overlay {
        position: fixed !important;
        z-index: 100000 !important;
      }
      .custom-marker-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 120px;
        max-width: 180px;
        background: rgba(255,255,255,0.55);
        backdrop-filter: blur(6px) saturate(120%);
        border-radius: 18px;
        box-shadow: 0 4px 24px rgba(107,70,193,0.13), 0 1.5px 6px rgba(0,0,0,0.08);
        border: 2.5px solid #e5e7eb;
        padding: 10px 10px 8px 10px;
        transition: transform 0.25s, box-shadow 0.25s, border 0.25s;
        cursor: pointer;
        position: relative;
        z-index: 10;
      }
      .custom-marker-img {
        width: 100px;
        height: 60px;
        border-radius: 12px;
        background-size: cover;
        background-position: center;
        margin-bottom: 8px;
        box-shadow: 0 2px 8px rgba(107,70,193,0.10);
        border: 1.5px solid #bfa6ff;
      }
      .custom-marker-label {
        font-size: 15px;
        font-weight: 700;
        color: #6B46C1;
        text-align: center;
        padding: 2px 0 0 0;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 4px rgba(107,70,193,0.08);
        background: none;
        border-radius: 8px;
      }
      .custom-marker-card:hover {
        transform: scale(1.08) translateY(-2px);
        box-shadow: 0 8px 32px rgba(107,70,193,0.18), 0 2px 8px rgba(0,0,0,0.10);
        border: 2.5px solid #6B46C1;
        z-index: 20;
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
        .custom-marker-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 120px;
          max-width: 180px;
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(6px) saturate(120%);
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(107,70,193,0.13), 0 1.5px 6px rgba(0,0,0,0.08);
          border: 2.5px solid #e5e7eb;
          padding: 10px 10px 8px 10px;
          transition: transform 0.25s, box-shadow 0.25s, border 0.25s;
          cursor: pointer;
          position: relative;
          z-index: 10;
        }
        .custom-marker-img {
          width: 100px;
          height: 60px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
          margin-bottom: 8px;
          box-shadow: 0 2px 8px rgba(107,70,193,0.10);
          border: 1.5px solid #bfa6ff;
        }
        .custom-marker-label {
          font-size: 15px;
          font-weight: 700;
          color: #6B46C1;
          text-align: center;
          padding: 2px 0 0 0;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 4px rgba(107,70,193,0.08);
          background: none;
          border-radius: 8px;
        }
        .custom-marker-card:hover {
          transform: scale(1.08) translateY(-2px);
          box-shadow: 0 8px 32px rgba(107,70,193,0.18), 0 2px 8px rgba(0,0,0,0.10);
          border: 2.5px solid #6B46C1;
          z-index: 20;
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
          <VerticalNav onNavigate={handleNavigation} currentScene={currentScene} scenes={scenes} />,
          portalContainer
        )}
    </div>
  );
};

export default ViewerComponent;
