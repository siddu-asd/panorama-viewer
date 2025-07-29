import React, { useEffect, useRef, useCallback, useState } from 'react';
import ReactDOM from 'react-dom';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import VerticalNav from './VerticalNav';
import '../styles/ViewerComponent.css';
import '../styles/PanoramaViewer.css';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=10-3-302+to+303,+Masab+Tank+Road,+NMDC+Colony,+Venkatadri+Colony,+Masab+Tank,+Hyderabad,+Telangana+500028';

const scenes = {
  ENTRY: {
    panorama: './office-15.jpg',
    markers: [
      { id: 'TO-ROOM1', image: './office-10.jpg', tooltip: 'Go to Office Room', position: { yaw: -3.0, pitch: -0.15 }, target: 'ROOM1' },
      { id: 'TO-STUDIO-OUTSIDE', image: './office-6.jpg', tooltip: 'Go to Studio Entrance', position: { yaw: -2.0, pitch: -0.1 }, target: 'STUDIO-OUTSIDE' },
      { id: 'TO-NEW-OFFICE', image: './office-11.jpg', tooltip: 'Go to New Office', position: { yaw: 1.5, pitch: 0.2 }, target: 'NEW-OFFICE' },
    ],
  },
  ROOM1: {
    panorama: './office-10.jpg',
    markers: [
      { id: 'TO-ADMIN-BLOCK', image: './office-14.jpg', tooltip: 'Go to Admin Block', position: { yaw: 2.5, pitch: -0.1 }, target: 'ADMIN-BLOCK' },
      { id: 'ROOM1-BACK', image: './office-15.jpg', tooltip: 'Back to Main Entry', position: { yaw: -0.6, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'ADMIN-BLOCK': {
    panorama: './office-14.jpg',
    markers: [
      { id: 'TO-MEETING-ROOM', image: './office-7.jpg', tooltip: 'Go to Meeting Room', position: { yaw: -0.7, pitch: -0.1 }, target: 'MEETING-ROOM' },
      { id: 'TO-WORKSPACE-FROM-ADMIN', image: './office-7.jpg', tooltip: 'Go to Workspace', position: { yaw: -0.4, pitch: 0.1 }, target: 'WORKSPACE' },
      { id: 'ADMIN-BLOCK-BACK', image: './office-10.jpg', tooltip: 'Back to Office Room', position: { yaw: 2.6, pitch: -0.1 }, target: 'ROOM1' },
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
      { id: 'TO-NEW-OFFICE-INSIDE', image: './office-12.jpg', tooltip: 'Go to New Office Interior', position: { yaw: -0.2, pitch: 0.1 }, target: 'NEW-OFFICE-INSIDE' },
      { id: 'NEW-OFFICE-BACK', image: './office-15.jpg', tooltip: 'Back to Main Entry', position: { yaw: 1.5, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'NEW-OFFICE-INSIDE': {
    panorama: './office-12.jpg',
    markers: [
      { id: 'NEW-OFFICE-INSIDE-BACK', image: './office-11.jpg', tooltip: 'Back to New Office', position: { yaw: -3.55, pitch: -0.1 }, target: 'NEW-OFFICE' },
    ],
  },
  'STUDIO-OUTSIDE': {
    panorama: './office-6.jpg',
    markers: [
      { id: 'TO-STUDIO', image: './office-1.jpg', tooltip: 'Go to Studio', position: { yaw: 1.9, pitch: 0.05 }, target: 'STUDIO' },
      { id: 'STUDIO-OUTSIDE-BACK', image: './office-15.jpg', tooltip: 'Back to Main Entry', position: { yaw: -0.6, pitch: 0.05 }, target: 'ENTRY' },
    ],
  },
  'STUDIO': {
    panorama: './office-16.jpg',
    markers: [
      { id: 'STUDIO-BACK', image: './office-6.jpg', tooltip: 'Back to Studio Entrance', position: { yaw: -2.19, pitch: -0.18 }, target: 'STUDIO-OUTSIDE' },
    ],
  },
};

const ViewerComponent = ({ toggleChatBot, currentScene, switchToScene }) => {
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const autorotateRef = useRef(null);
  const [portalContainer, setPortalContainer] = useState(null);

  const setSceneMarkers = useCallback((markerList) => {
    const plugin = markersPluginRef.current;
    if (!plugin) return;
    plugin.clearMarkers();
    markerList.forEach(({ id, position, image, tooltip }) => {
      plugin.addMarker({
        id,
        position,
        html: `
          <div class="custom-marker-outer">
            <div class="custom-marker-label always-visible">${tooltip}</div>
            <div class="custom-marker-dot" style="--marker-img: url('${image}');"></div>
          </div>
        `,
        anchor: 'center center',
      });
    });
  }, []);

  const internalSwitchToScene = useCallback(async (sceneId) => {
    const scene = scenes[sceneId];
    if (!scene) return;
    autorotateRef.current?.stop();
    await viewerRef.current.setPanorama(scene.panorama);
    setSceneMarkers(scene.markers);
    switchToScene(sceneId); // Update parent state and URL
    autorotateRef.current?.start();
  }, [setSceneMarkers, switchToScene]);

  const handleNavigation = useCallback((target) => {
    if (target === 'exit') {
      if (window.confirm('Are you sure you want to exit?')) {
        window.location.href = '/';
      }
    } else {
      internalSwitchToScene(target);
    }
  }, [internalSwitchToScene]);

  useEffect(() => {
    const container = document.getElementById('app-viewer-container');
    const viewer = new Viewer({
      container,
      panorama: scenes[currentScene]?.panorama || scenes.ENTRY.panorama,
      defaultZoomLvl: 30,
      navbar: [
        {
          id: 'googlemaps',
          title: 'Open in Google Maps',
          className: 'psv-googlemaps-btn',
          content: `<svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24 8C16.268 8 10 14.268 10 22c0 7.732 14 18 14 18s14-10.268 14-18c0-7.732-6.268-14-14-14zm0 18.5A4.5 4.5 0 1 1 24 17a4.5 4.5 0 0 1 0 9.5z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="22" r="4.5" fill="currentColor"/></svg>`,
          onClick: () => window.open(GOOGLE_MAPS_URL, '_blank', 'noopener,noreferrer'),
        },
        'autorotate',
        'fullscreen',
      ],
      plugins: [MarkersPlugin, [AutorotatePlugin, { autorotateSpeed: 0.1 }]],
    });

    viewerRef.current = viewer;

    viewer.addEventListener('ready', () => {
      markersPluginRef.current = viewer.getPlugin(MarkersPlugin);
      autorotateRef.current = viewer.getPlugin(AutorotatePlugin);
      autorotateRef.current?.start();
      setSceneMarkers(scenes[currentScene]?.markers || scenes.ENTRY.markers);
    });

    const logoOverlay = document.createElement('div');
    logoOverlay.className = 'psv-logo-overlay';
    logoOverlay.innerHTML = `<img class="responsive-logo" src="/LOGO.png" alt="Logo" style="cursor: pointer;" />`;
    logoOverlay.querySelector('.responsive-logo')?.addEventListener('click', () => {
      window.location.href = '/';
    });
    viewer.container.appendChild(logoOverlay);

    const chatbotOverlay = document.createElement('div');
    chatbotOverlay.className = 'psv-chatbot-overlay';
    chatbotOverlay.innerHTML = `<img id="psv-chatbot-img" src="/NISAAF.png" alt="Bot" style="width: 320px; height: 280px; object-fit: contain; cursor: pointer;" />`;
    chatbotOverlay.querySelector('#psv-chatbot-img')?.addEventListener('click', toggleChatBot);
    container.appendChild(chatbotOverlay);

    viewer.getPlugin(MarkersPlugin)?.addEventListener('select-marker', (e) => {
      const target = Object.values(scenes).flatMap((s) => s.markers).find((m) => m.id === e.marker.id)?.target;
      if (target) internalSwitchToScene(target);
    });

    setPortalContainer(container);

    return () => {
      viewer.destroy();
    };
  }, [setSceneMarkers, internalSwitchToScene, toggleChatBot, currentScene]);

  useEffect(() => {
    // Update scene when currentScene prop changes
    if (viewerRef.current && scenes[currentScene]) {
      internalSwitchToScene(currentScene);
    }
  }, [currentScene, internalSwitchToScene]);

  return (
    <div>
      <div id="panorama" style={{ width: '100%', height: '100vh' }} />
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
          <VerticalNav
            onNavigate={handleNavigation}
            currentScene={currentScene}
            scenes={scenes}
            portalContainer={portalContainer}
          />,
          portalContainer
        )}
    </div>
  );
};

export default ViewerComponent;