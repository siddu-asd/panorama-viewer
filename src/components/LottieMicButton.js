import React from 'react';

// LottieMicButton renders the provided 3D mic animation using dotlottie-player web component
const LottieMicButton = ({ onClick, className = '' }) => {
  React.useEffect(() => {
    if (!document.querySelector('script[data-dotlottie-player]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs';
      script.type = 'module';
      script.setAttribute('data-dotlottie-player', 'true');
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      className={className}
      style={{ width: 80, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'none', border: 'none' }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label="Mic"
    >
      <dotlottie-player
        src="https://lottie.host/89522e7d-9d4b-42c3-9849-2ff4fb6f4c60/vojnSWaHct.lottie"
        background="transparent"
        speed="1"
        style={{ width: '80px', height: '60px' }}
        loop
        autoplay
      ></dotlottie-player>
    </div>
  );
};

export default LottieMicButton; 