import React, { useEffect } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

const ViewerComponent = () => {
  useEffect(() => {
    const container = document.getElementById('app-viewer-container');

    const viewer = new Viewer({
      container,
      panorama: '/360-1.jpg',
      navbar: true,
      defaultZoomLvl: 30,
      plugins: [
        [MarkersPlugin],
        [AutorotatePlugin, { speed: 0.5 }],
      ],
    });

    const autorotate = viewer.getPlugin(AutorotatePlugin);
    autorotate.start();

    const markersPlugin = viewer.getPlugin(MarkersPlugin);

    const addInitialMarkers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_1',
        position: { yaw: 0.3, pitch: 0.1 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:red;border-radius:50%;border:2px solid white;"></div>`,
        anchor: 'center center',
        tooltip: 'Room 1',
      });

      markersPlugin.addMarker({
        id: 'ROOM_2',
        position: { yaw: -0.5, pitch: 0.1 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:green;border-radius:50%;border:2px solid white;"></div>`,
        anchor: 'center center',
        tooltip: 'Room 2',
      });
    };

    const addRoom1Markers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_1_DETAIL',
        position: { yaw: 0.5, pitch: 0.2 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:yellow;border-radius:50%;border:2px solid white;"></div>`,
        anchor: 'center center',
        tooltip: 'Room 1 Details',
      });

      markersPlugin.addMarker({
        id: 'BACK_TO_HOME',
        position: { yaw: -1.5, pitch: 0.0 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:black;border-radius:50%;border:2px solid white;"></div>`,
        anchor: 'center center',
        tooltip: 'Back',
      });
    };

    const addRoom2Markers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_2_DETAIL',
        position: { yaw: -0.2, pitch: 0.1 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:blue;border-radius:50%;border:2px solid white;"></div>`,
        anchor: 'center center',
        tooltip: 'Room 2 Details',
      });

      markersPlugin.addMarker({
        id: 'BACK_TO_HOME',
        position: { yaw: 1.5, pitch: 0.0 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:black;border-radius:50%;border:2px solid white;"></div>`,
        anchor: 'center center',
        tooltip: 'Back',
      });
    };

    const addFinalRoomMarkers = () => {
      markersPlugin.clearMarkers();

      markersPlugin.addMarker({
        id: 'ROOM_1_FINAL',
        position: { yaw: 0.8, pitch: 0.1 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:purple;border-radius:50%;border:2px solid white;"></div>`,
        anchor: 'center center',
        tooltip: 'Room 1 Final View',
      });

      markersPlugin.addMarker({
        id: 'BACK_TO_ROOM_1',
        position: { yaw: -1.5, pitch: 0.0 },
        html: `<div style="pointer-events:auto;cursor:pointer;width:30px;height:30px;background:black;border-radius:50%;border:2px solid white;"></div>`,
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
  }, []);

  return (
    <div
      id="app-viewer-container"
      style={{ width: '100%', height: '100vh', overflow: 'hidden' }}
    />
  );
};

export default ViewerComponent;
