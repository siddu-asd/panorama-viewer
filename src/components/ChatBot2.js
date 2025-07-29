import React, { useEffect, useRef, useState } from 'react';
import '../styles/ChatBot2.css';
import { useChatBot } from './useChatBot';
import BotMessage from './BotMessage';
import UserMessage from './UserMessage';
import InputContainer from './InputContainer';
import { useTranslation } from 'react-i18next';

async function playBotAudio(text, language = 'en') {
  try {
    const response = await fetch('https://nissa-chat-bot.onrender.com/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    if (!response.ok) throw new Error('TTS failed');
    const audioData = await response.arrayBuffer();
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  } catch (err) {
    console.error('Audio playback error:', err);
  }
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' },
];

const ChatBot2 = ({ isVisible, toggleChatBot, switchToScene }) => {
  const {
    messages,
    isTyping,
    messagesEndRef,
    inputMode,
    userMessage,
    setUserMessage,
    isListening,
    handleSendMessage,
    handleVoiceButtonClick,
    inputRef,
    mutedMessages,
    handleSpeakerClick,
  } = useChatBot(isVisible, 'en', switchToScene);

  const { t, i18n } = useTranslation();
  const [languageSelected, setLanguageSelected] = useState(true);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const lastBotMsgRef = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setSelectedLang(lng);
  };

  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.type === 'bot' && lastBotMsgRef.current !== lastMsg.content && !mutedMessages.has(lastMsg.id)) {
        playBotAudio(lastMsg.content, i18n.language);
        lastBotMsgRef.current = lastMsg.content;
      }
    }
  }, [messages, i18n.language, mutedMessages]);

  if (!isVisible) return null;

  if (!languageSelected) {
    return (
      <div className="chatbot-container chatbot-language-select">
        <div className="language-select-card">
          <div className="main-bot-avatar-container">
            <img
              src="/NISAAF.png"
              alt="Bot"
              className="main-bot-avatar"
              onClick={toggleChatBot}
              title="Click to close"
            />
          </div>
          <div className="language-select-prompt">{t('choose_language')}</div>
          <div className="language-select-grid">
            <div className="language-row">
              <button className="language-btn" onClick={() => { changeLanguage('en'); setLanguageSelected(true); }}>English</button>
              <button className="language-btn" onClick={() => { changeLanguage('te'); setLanguageSelected(true); }}>తెలుగు</button>
              <button className="language-btn" onClick={() => { changeLanguage('hi'); setLanguageSelected(true); }}>हिन्दी</button>
            </div>
            <div className="language-row language-row-center">
              <span className="language-btn-spacer" />
              <button className="language-btn" onClick={() => { changeLanguage('ta'); setLanguageSelected(true); }}>தமிழ்</button>
              <button className="language-btn" onClick={() => { changeLanguage('mr'); setLanguageSelected(true); }}>मराठी</button>
              <span className="language-btn-spacer" />
            </div>
          </div>
        </div>
        <button
          className="continue-english-btn"
          onClick={() => { changeLanguage('en'); setLanguageSelected(true); }}
        >
          {t('start_conversation')}
        </button>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="bot-header">
        <div className="main-bot-avatar-container">
          <img
            src="/NISAAF.png"
            alt="Bot"
            className="main-bot-avatar"
            onClick={toggleChatBot}
            title="Click to close"
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '8px 16px 0 16px',
        background: 'transparent',
        zIndex: 10
      }}>
        <label style={{ marginRight: 8, fontWeight: 500 }}>{t('language')}:</label>
        <select
          onChange={e => changeLanguage(e.target.value)}
          value={i18n.language}
          style={{
            borderRadius: 6,
            border: '1px solid #ccc',
            padding: '4px 8px',
            fontSize: 14,
            background: '#fff',
            color: '#333',
            outline: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) =>
          msg.type === 'bot' ? (
            <BotMessage
              key={index}
              message={msg}
              isMuted={mutedMessages.has(msg.id)}
              handleSpeakerClick={handleSpeakerClick}
            />
          ) : (
            <UserMessage key={index} content={msg.content} />
          )
        )}
        {isTyping && (
          <div className="typing-indicator-wrapper">
            <div className="bot-message-container">
              <div className="bot-avatar">
                <img src="/NISAAF.png" alt="Bot" />
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
      />
    </div>
  );
};

export default ChatBot2;