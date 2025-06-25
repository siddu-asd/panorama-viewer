import React from 'react';
import './styles/ChatBot2.css';
import { useChatBot } from './useChatBot';
import BotMessage from './BotMessage';
import UserMessage from './UserMessage';
import InputContainer from './InputContainer';

const ChatBot2 = ({ isVisible, toggleChatBot }) => {
  const {
    messages,
    isTyping,
    messagesEndRef,
    handleSpeakerClick,
    mutedMessages,
    inputMode,
    userMessage,
    setUserMessage,
    isListening,
    handleSendMessage,
    handleVoiceButtonClick,
    inputRef,
    isSpeaking,
  } = useChatBot(isVisible);

  if (!isVisible) return null;

  return (
    <div className="chatbot-container">
      <div className="bot-header">
        <div className="main-bot-avatar-container">
          <img
            src="/nisaahalf.png"
            alt="Bot"
            className="main-bot-avatar"
            onClick={toggleChatBot}
            title="Click to close"
          />
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) =>
          msg.type === 'bot' ? (
            <BotMessage
              key={index}
              message={msg}
              handleSpeakerClick={handleSpeakerClick}
              isMuted={mutedMessages.has(msg.id)}
            />
          ) : (
            <UserMessage key={index} content={msg.content} />
          )
        )}
        {isTyping && (
          <div className="typing-indicator-wrapper">
            <div className="bot-message-container">
              <div className="bot-avatar">
                <img src="/nisaa.png" alt="Bot" />
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <InputContainer
        inputMode={inputMode}
        userMessage={userMessage}
        setUserMessage={setUserMessage}
        isListening={isListening}
        handleSendMessage={handleSendMessage}
        handleVoiceButtonClick={handleVoiceButtonClick}
        inputRef={inputRef}
        isSpeaking={isSpeaking}
      />
    </div>
  );
};

export default ChatBot2;