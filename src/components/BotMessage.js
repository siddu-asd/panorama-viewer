import React from 'react';
import BotResponse from './BotResponse';
import '../styles/BotMessage.css';

const BotMessage = ({ message, handleSpeakerClick, isMuted, isPlaying, switchToScene }) => {
  const handleSceneClick = (e) => {
    e.preventDefault(); // Prevent default navigation
    console.log('handleSceneClick triggered, message.url:', message.url);
    if (message.url) {
      const urlParts = message.url.split('?');
      if (urlParts.length < 2) {
        console.warn('Invalid message.url, no query params:', message.url);
        return;
      }
      const urlParams = new URLSearchParams(urlParts[1]);
      const sceneId = urlParams.get('scene');
      if (sceneId) {
        console.log('Switching to scene with refresh:', sceneId);
        window.location.href = `/#panorama?scene=${sceneId}`;
      } else {
        console.warn('No sceneId found in message.url:', message.url);
      }
    } else {
      console.warn('message.url is undefined or empty');
    }
  };

  const onSpeakClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof handleSpeakerClick === 'function') {
      handleSpeakerClick(message.id);
    } else {
      console.warn('handleSpeakerClick is not defined or not a function');
    }
  };

  return (
    <div className="bot-message-container">
      <div className="bot-avatar">
        <img src="/LOGO.png" alt="Bot" />
      </div>
      <div className="bot-content">
        <div className="message bot">
          <BotResponse content={message.displayedContent} />
          {message.image && (
            <div className="bot-message-image">
              <img
                src={message.image}
                alt={message.label || '360° view'}
                onClick={handleSceneClick}
                style={{ maxWidth: '100%', borderRadius: 12, margin: '8px 0', cursor: 'pointer' }}
              />
            </div>
          )}
          {message.url && message.label && (
            <div className="bot-message-link" style={{ marginBottom: 8 }}>
              <a
                href={message.url}
                onClick={handleSceneClick}
                style={{
                  color: '#007bff',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {message.label || 'Open Virtual Tour'}
              </a>
            </div>
          )}
          <button
            className={`speak-button ${isMuted ? 'muted' : ''} ${isPlaying ? 'playing' : ''}`}
            onClick={onSpeakClick}
            title={
              isPlaying 
                ? 'Stop playing this message' 
                : isMuted 
                  ? 'Unmute and speak this message' 
                  : 'Click to hear this message'
            }
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : isMuted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

BotMessage.defaultProps = {
  handleSpeakerClick: null,
  isMuted: false,
  isPlaying: false,
  switchToScene: null,
};

export default BotMessage;