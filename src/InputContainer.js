import React from 'react';

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
      className={`voice-button ${isListening ? 'listening' : ''} ${inputMode === 'voice' ? 'active' : ''} ${
        isSpeaking ? 'speaking' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleVoiceButtonClick();
      }}
      title={
        isSpeaking
          ? 'Stop chatbot speech'
          : inputMode === 'voice'
          ? isListening
            ? 'Stop listening'
            : 'Start listening'
          : 'Switch to voice mode'
      }
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
      </svg>
    </button>
  </div>
);

export default InputContainer;