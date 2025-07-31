import React from 'react';
import LottieMicButton from './LottieMicButton';

const InputContainer = ({
  inputMode,
  userMessage,
  setUserMessage,
  isListening,
  handleSendMessage,
  handleVoiceButtonClick,
  inputRef,
  isSpeaking,
}) => (
  <div
    className="input-container"
    onClick={() => {
      if (inputMode === 'text' && inputRef.current) inputRef.current.focus();
    }}
  >
    {inputMode === 'text' ? (
      <input
        ref={inputRef}
        type="text"
        className="message-input"
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        onFocus={() => console.log('Input focused')}
        onBlur={() => console.log('Input blurred')}
        onClick={() => {
          if (inputRef.current) inputRef.current.focus();
        }}
        placeholder="Type your message..."
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        disabled={false}
        autoFocus={inputMode === 'text'}
      />
    ) : (
      <div className="voice-input-display">
        <span className="voice-status">{isListening ? 'Listening...' : ''}</span>
        {userMessage && <span className="voice-transcript">"{userMessage}"</span>}
      </div>
    )}
    <button
      className={`send-button ${userMessage.trim() ? 'ready' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleSendMessage();
      }}
      disabled={!userMessage.trim()}
      title="Send message"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </button>
    <button
      className={`voice-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('Voice button clicked');
        handleVoiceButtonClick();
      }}
      title={
        isSpeaking
          ? 'Stop chatbot speech'
          : isListening
          ? 'Stop listening'
          : 'Start listening'
      }
      style={{ 
        padding: 0, 
        background: 'none', 
        border: 'none',
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <LottieMicButton width={32} height={32} />
        {isListening && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.3)',
              animation: 'pulse 1.5s infinite',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </button>
  </div>
);

export default InputContainer;