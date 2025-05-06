import React, { useEffect } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import '@photo-sphere-viewer/core/index.css';

const ViewerComponent = () => {
  useEffect(() => {
    const viewer = new Viewer({
      container: 'app-viewer-container',
      panorama: '/360-2.jpg',
      navbar: false,
      plugins: [
        [AutorotatePlugin, { speed: '1rpm', delay: 8000 }]
      ]
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
