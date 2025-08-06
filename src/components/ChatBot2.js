import React, { useEffect, useRef, useState } from 'react';
import '../styles/ChatBot2.css';
import { useChatBot } from './useChatBot';
import BotMessage from './BotMessage';
import UserMessage from './UserMessage';
import InputContainer from './InputContainer';
import { useTranslation } from 'react-i18next';

async function playBotAudio(text, language = 'en', messageId = null, setMutedMessages = null) {
  try {
    console.log('Playing bot audio for:', text, 'language:', language);
    console.log('Browser:', navigator.userAgent);
    
    // Use browser speech synthesis for reliable voice output
    if ('speechSynthesis' in window) {
      console.log('Speech synthesis supported');
      
      // Get available voices with better browser compatibility
      let voices = speechSynthesis.getVoices();
      console.log('Initial voices count:', voices.length);
      
      // If voices aren't loaded yet, wait for them with multiple attempts
      if (voices.length === 0) {
        console.log('Waiting for voices to load...');
        
        // Try multiple approaches to load voices
        for (let attempt = 0; attempt < 3; attempt++) {
          console.log(`Voice loading attempt ${attempt + 1}`);
          
          // Method 1: Wait for voiceschanged event
          voices = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log('Voice loading timeout, trying direct getVoices()');
              resolve(speechSynthesis.getVoices());
            }, 2000);
            
            speechSynthesis.onvoiceschanged = () => {
              clearTimeout(timeout);
              const loadedVoices = speechSynthesis.getVoices();
              console.log('Voices loaded via event:', loadedVoices.length);
              resolve(loadedVoices);
            };
            
            // Trigger voices to load
            speechSynthesis.getVoices();
          });
          
          if (voices.length > 0) {
            console.log('Voices loaded successfully:', voices.length);
            break;
          }
          
          // Method 2: Try speaking a short utterance to trigger voice loading
          if (attempt < 2) {
            console.log('Trying to trigger voice loading with short utterance...');
            const tempUtterance = new SpeechSynthesisUtterance('');
            speechSynthesis.speak(tempUtterance);
            speechSynthesis.cancel();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      console.log('Final voices count:', voices.length);
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang}) - ${v.voiceURI}`));
      
      let selectedVoice = null;
      
      // 1. Try Lisa (best quality)
      selectedVoice = voices.find(voice => {
        const voiceName = voice.name.toLowerCase();
        const voiceURI = voice.voiceURI.toLowerCase();
        return (
          voice.lang.startsWith('en') &&
          (voiceName.includes('lisa') || voiceURI.includes('lisa'))
        );
      });
      
      if (selectedVoice) {
        console.log('Found Lisa voice:', selectedVoice.name);
      }
      
      // 2. If no Lisa, try Serena
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          const voiceURI = voice.voiceURI.toLowerCase();
          return (
            voice.lang.startsWith('en') &&
            (voiceName.includes('serena') || voiceURI.includes('serena'))
          );
        });
        if (selectedVoice) {
          console.log('Found Serena voice:', selectedVoice.name);
        }
      }
      
      // 3. If no Serena, try Karen
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          const voiceURI = voice.voiceURI.toLowerCase();
          return (
            voice.lang.startsWith('en') &&
            (voiceName.includes('karen') || voiceURI.includes('karen'))
          );
        });
        if (selectedVoice) {
          console.log('Found Karen voice:', selectedVoice.name);
        }
      }
      
      // 4. If no specific voices, find ANY female voice (no male voices)
      if (!selectedVoice) {
        console.log('Looking for any female voice...');
        selectedVoice = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          const voiceURI = voice.voiceURI.toLowerCase();
          
          // Skip male voices
          if (voiceName.includes('david') || voiceName.includes('james') || 
              voiceName.includes('john') || voiceName.includes('mike') || 
              voiceName.includes('tom') || voiceName.includes('male') ||
              voiceName.includes('alex') || voiceName.includes('daniel') ||
              voiceName.includes('mark') || voiceName.includes('peter') ||
              voiceName.includes('robert') || voiceName.includes('steve') ||
              voiceURI.includes('david') || voiceURI.includes('james') ||
              voiceURI.includes('john') || voiceURI.includes('mike') ||
              voiceURI.includes('tom') || voiceURI.includes('male') ||
              voiceURI.includes('alex') || voiceURI.includes('daniel') ||
              voiceURI.includes('mark') || voiceURI.includes('peter') ||
              voiceURI.includes('robert') || voiceURI.includes('steve')) {
            return false;
          }
          
          // Look for female indicators
          return (
            voice.lang.startsWith('en') &&
            (voiceName.includes('female') ||
             voiceURI.includes('female') ||
             voiceName.includes('samantha') ||
             voiceName.includes('victoria') ||
             voiceName.includes('tessa') ||
             voiceName.includes('eva') ||
             voiceName.includes('sarah') ||
             voiceName.includes('emma') ||
             voiceName.includes('sophie') ||
             voiceName.includes('olivia') ||
             voiceName.includes('chloe') ||
             voiceName.includes('grace') ||
             voiceName.includes('lily') ||
             voiceName.includes('zoe') ||
             voiceName.includes('mia') ||
             voiceName.includes('ava') ||
             voiceName.includes('isabella') ||
             voiceName.includes('emily') ||
             voiceName.includes('madison') ||
             voiceName.includes('abigail') ||
             voiceURI.includes('samantha') ||
             voiceURI.includes('victoria') ||
             voiceURI.includes('tessa') ||
             voiceURI.includes('eva') ||
             voiceURI.includes('sarah') ||
             voiceURI.includes('emma') ||
             voiceURI.includes('sophie') ||
             voiceURI.includes('olivia') ||
             voiceURI.includes('chloe') ||
             voiceURI.includes('grace') ||
             voiceURI.includes('lily') ||
             voiceURI.includes('zoe') ||
             voiceURI.includes('mia') ||
             voiceURI.includes('ava') ||
             voiceURI.includes('isabella') ||
             voiceURI.includes('emily') ||
             voiceURI.includes('madison') ||
             voiceURI.includes('abigail'))
          );
        });
        if (selectedVoice) {
          console.log('Found female voice:', selectedVoice.name);
        }
      }
      
      // 5. Fallback to any English voice if no female voice found
      if (!selectedVoice && voices.length > 0) {
        console.log('No female voice found, trying any English voice...');
        selectedVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.default !== false
        );
        if (selectedVoice) {
          console.log('Found fallback English voice:', selectedVoice.name);
        }
      }
      
      // Only proceed if we have a voice
      if (selectedVoice) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'en' ? 'en-US' : language;
        utterance.volume = 1.0; // Full volume for clarity
        utterance.rate = 0.9; // Slightly slower for sweetness and clarity
        utterance.pitch = 1.1; // Slightly higher pitch for sweetness
        
        utterance.voice = selectedVoice;
        console.log('Using selected voice:', selectedVoice.name, selectedVoice.lang);
        
        utterance.onstart = () => console.log('Speech synthesis started');
        utterance.onend = () => {
          console.log('Speech synthesis ended');
          // Automatically mute the message after it finishes speaking
          if (messageId && setMutedMessages) {
            console.log('Automatically muting message after speech:', messageId);
            setMutedMessages(prev => new Set([...prev, messageId]));
          }
        };
        utterance.onerror = (e) => {
          console.error('Speech synthesis error:', e);
          console.log('Error details:', {
            error: e.error,
            message: e.message,
            elapsedTime: e.elapsedTime,
            charIndex: e.charIndex
          });
        };
        
        // Cancel any ongoing speech before starting new one
        speechSynthesis.cancel();
        
        // Add a small delay to ensure cancellation is complete
        setTimeout(() => {
          speechSynthesis.speak(utterance);
          console.log('Speech synthesis initiated');
        }, 100);
        
      } else {
        console.log('NO VOICE FOUND - NOT SPEAKING');
        console.log('Available voices were:', voices.map(v => `${v.name} (${v.lang})`));
      }
      
    } else {
      console.error('Speech synthesis not supported in this browser');
      console.log('Browser details:', {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform
      });
    }
    
  } catch (err) {
    console.error('Audio playback error:', err);
    console.log('Error details:', {
      message: err.message,
      stack: err.stack,
      browser: navigator.userAgent
    });
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
    setMutedMessages,
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
      
      // Check if this is a welcome message or a new bot message
      const isWelcomeMessage = lastMsg.id === 'welcome';
      const isNewMessage = lastBotMsgRef.current !== lastMsg.content;
      const shouldSpeak = isWelcomeMessage || isNewMessage;
      
      // Re-enabled automatic TTS to ensure voice works
      if (lastMsg.type === 'bot' && shouldSpeak && !mutedMessages.has(lastMsg.id)) {
        console.log('Playing bot audio for message:', lastMsg.content);
        console.log('Current language:', i18n.language);
        console.log('Message muted:', mutedMessages.has(lastMsg.id));
        console.log('Is welcome message:', isWelcomeMessage);
        console.log('Is new message:', isNewMessage);
        
        playBotAudio(lastMsg.content, i18n.language, lastMsg.id, setMutedMessages);
        lastBotMsgRef.current = lastMsg.content;
      } else {
        console.log('Bot audio not triggered because:', {
          isBot: lastMsg.type === 'bot',
          isWelcome: isWelcomeMessage,
          isNew: isNewMessage,
          shouldSpeak: shouldSpeak,
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