import React, { useEffect, useRef, useState } from 'react';
import '../styles/ChatBot2.css';
import { useChatBot } from './useChatBot';
import BotMessage from './BotMessage';
import UserMessage from './UserMessage';
import InputContainer from './InputContainer';
import { useTranslation } from 'react-i18next';

async function playBotAudio(text, language = 'en') {
  try {
    console.log('Playing bot audio for:', text, 'language:', language);
    
    // Try browser speech synthesis first for better voice control
    if ('speechSynthesis' in window) {
      console.log('Using browser speech synthesis for Siri-like voice');
      
      // Get available voices
      let voices = speechSynthesis.getVoices();
      
      // If voices aren't loaded yet, wait for them
      if (voices.length === 0) {
        console.log('Waiting for voices to load...');
        voices = await new Promise(resolve => {
          speechSynthesis.onvoiceschanged = () => {
            const loadedVoices = speechSynthesis.getVoices();
            console.log('Voices loaded:', loadedVoices.length);
            resolve(loadedVoices);
          };
        });
      }
      
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang}) - ${v.voiceURI}`));
      
      // Find Lisa or Eva voice with fallback
      let selectedVoice = null;
      
      // First priority: Look specifically for Lisa or Eva voices
      selectedVoice = voices.find(voice => {
        const voiceName = voice.name.toLowerCase();
        const voiceURI = voice.voiceURI.toLowerCase();
        return (
          voiceName.includes('lisa') ||
          voiceName.includes('eva') ||
          voiceURI.includes('lisa') ||
          voiceURI.includes('eva')
        ) && voice.lang.startsWith('en');
      });
      
      // Second priority: If Lisa/Eva not found, try any female voice
      if (!selectedVoice) {
        console.log('Lisa/Eva not found, trying other female voices');
        selectedVoice = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          const voiceURI = voice.voiceURI.toLowerCase();
          return (
            voiceName.includes('female') ||
            voiceName.includes('samantha') ||
            voiceName.includes('karen') ||
            voiceName.includes('victoria') ||
            voiceName.includes('martha') ||
            voiceName.includes('serena') ||
            voiceName.includes('tessa') ||
            voiceName.includes('alex') ||
            voiceName.includes('siri') ||
            voiceURI.includes('female') ||
            voiceURI.includes('samantha') ||
            voiceURI.includes('karen') ||
            voiceURI.includes('victoria')
          ) && voice.lang.startsWith('en');
        });
      }
      
      // Third priority: Any English voice that's not obviously male
      if (!selectedVoice) {
        console.log('No female voice found, trying non-male voices');
        selectedVoice = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          return (
            voice.lang.startsWith('en') &&
            !voiceName.includes('male') &&
            !voiceName.includes('david') &&
            !voiceName.includes('tom') &&
            !voiceName.includes('james') &&
            !voiceName.includes('john') &&
            !voiceName.includes('mike')
          );
        });
      }
      
      // Last resort: any English voice
      if (!selectedVoice) {
        console.log('No suitable voice found, using any English voice');
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        console.log('Selected voice:', selectedVoice.name, selectedVoice.lang, selectedVoice.voiceURI);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.volume = 0.9;
        utterance.rate = 0.85; // Slightly slower for more natural sound
        utterance.pitch = 1.2; // Higher pitch for more feminine sound
        utterance.lang = selectedVoice.lang;
        
        // Add event listeners for debugging
        utterance.onstart = () => console.log('Speech synthesis started with voice:', selectedVoice.name);
        utterance.onend = () => console.log('Speech synthesis ended');
        utterance.onerror = (e) => console.error('Speech synthesis error:', e);
        
        // Stop any currently speaking
        speechSynthesis.cancel();
        
        speechSynthesis.speak(utterance);
        return; // Exit early if speech synthesis works
      } else {
        console.log('No suitable voice found, falling back to TTS server');
      }
    }
    
    // Fallback to TTS server with explicit female voice request
    console.log('Falling back to TTS server with female voice request');
      const response = await fetch('https://nissa-chat-bot.onrender.com/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text, 
        language,
        voice: 'female', // Explicitly request female voice
        speed: 0.85, // Slightly slower speed
        pitch: 1.2, // Higher pitch for female voice
        gender: 'female' // Additional gender parameter
      }),
    });
    
    console.log('TTS response status:', response.status);
    
    if (!response.ok) {
      console.error('TTS failed with status:', response.status);
      throw new Error(`TTS failed with status: ${response.status}`);
    }
    
    const audioData = await response.arrayBuffer();
    console.log('Audio data received, size:', audioData.byteLength);
    
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    console.log('Audio URL created:', url);
    
    const audio = new Audio(url);
    
    // Add event listeners for debugging
    audio.addEventListener('loadstart', () => console.log('Audio loading started'));
    audio.addEventListener('canplay', () => console.log('Audio can play'));
    audio.addEventListener('play', () => console.log('Audio started playing'));
    audio.addEventListener('ended', () => console.log('Audio finished playing'));
    audio.addEventListener('error', (e) => console.error('Audio error:', e));
    
    // Set volume and play
    audio.volume = 0.9;
    await audio.play();
    console.log('Audio play() called successfully');
    
    // Clean up URL after playing
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
    });
    
  } catch (err) {
    console.error('Audio playback error:', err);
    // Final fallback: force female voice with speech synthesis
    try {
      if ('speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        console.log('Fallback voices available:', voices.map(v => v.name));
        
                 // Force find Lisa/Eva voice with fallback
         let fallbackVoice = voices.find(voice => {
           const name = voice.name.toLowerCase();
           const voiceURI = voice.voiceURI.toLowerCase();
           return (
             name.includes('lisa') ||
             name.includes('eva') ||
             voiceURI.includes('lisa') ||
             voiceURI.includes('eva')
           ) && voice.lang.startsWith('en');
         });
         
         // If Lisa/Eva not found, try any female voice
         if (!fallbackVoice) {
           fallbackVoice = voices.find(voice => {
             const name = voice.name.toLowerCase();
             return (
               name.includes('female') ||
               name.includes('samantha') ||
               name.includes('karen') ||
               name.includes('victoria') ||
               name.includes('martha')
             ) && voice.lang.startsWith('en');
           });
         }
         
         const utterance = new SpeechSynthesisUtterance(text);
         if (fallbackVoice) {
           utterance.voice = fallbackVoice;
           console.log('Using fallback voice:', fallbackVoice.name);
         } else {
           console.log('No suitable voice found, using default');
         }
        
        utterance.lang = language === 'en' ? 'en-US' : language;
        utterance.volume = 0.9;
        utterance.rate = 0.85;
        utterance.pitch = 1.2; // Higher pitch for female voice
        
        speechSynthesis.cancel(); // Stop any current speech
        speechSynthesis.speak(utterance);
        console.log('Using forced speech synthesis with female settings');
      }
    } catch (fallbackErr) {
      console.error('All audio methods failed:', fallbackErr);
    }
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
    currentlyPlaying,
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
    console.log('Messages changed:', messages?.length, 'Last message:', messages?.[messages.length - 1]);
    
    if (messages && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log('Last message:', lastMsg);
      
      if (lastMsg.type === 'bot' && lastBotMsgRef.current !== lastMsg.content && !mutedMessages.has(lastMsg.id)) {
        console.log('Playing bot audio for message:', lastMsg.content);
        console.log('Current language:', i18n.language);
        console.log('Message muted:', mutedMessages.has(lastMsg.id));
        
        playBotAudio(lastMsg.content, i18n.language);
        lastBotMsgRef.current = lastMsg.content;
      } else {
        console.log('Bot audio not triggered because:', {
          isBot: lastMsg.type === 'bot',
          isNew: lastBotMsgRef.current !== lastMsg.content,
          isMuted: mutedMessages.has(lastMsg.id)
        });
      }
    }
  }, [messages, i18n.language, mutedMessages]);

  if (!isVisible) return null;

  if (!languageSelected) {
    return (
      <div className="chatbot-container chatbot-language-select">
        <div className="language-select-card">
          <div className="main-logo-container">
            <div className="logo-wrapper">
              <img
                src="/LOGO.png"
                alt="Raising 100X Logo"
                className="main-logo"
                onClick={toggleChatBot}
                title="Click to close"
              />
            </div>
            <h1 className="chatbot-heading"> Nisaa-AI Assistant</h1>
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
        <div className="main-logo-container">
          <div className="logo-wrapper">
            <img
              src="/LOGO.png"
              alt="Raising 100X Logo"
              className="main-logo"
              onClick={toggleChatBot}
              title="Click to close"
            />
          </div>
          <h1 className="chatbot-heading">NISAA - Your Smart AI Assistant</h1>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) =>
          msg.type === 'bot' ? (
            <BotMessage
              key={index}
              message={msg}
              isMuted={mutedMessages.has(msg.id)}
              isPlaying={currentlyPlaying === msg.id}
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
                <img src="/LOGO.png" alt="Bot" />
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