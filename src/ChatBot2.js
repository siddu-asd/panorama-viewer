import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/ChatBot2.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const supportedLanguages = {
  english: { code: 'en-US', keywords: ['english', 'speak in english'] },
  hindi: { code: 'hi-IN', keywords: ['hindi', 'speak in hindi'] },
  spanish: { code: 'es-ES', keywords: ['spanish', 'speak in spanish'] },
  french: { code: 'fr-FR', keywords: ['french', 'speak in french'] },
};

const ChatBot2 = ({ isVisible, toggleChatBot }) => {
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [micPermission, setMicPermission] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const [voices, setVoices] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
    };

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    loadVoices();

    return () => {
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = null;
      }
    };
  }, []);

  // Voice speaking logic with improved clarity and female voice preference
  const speak = useCallback(
    (text) => {
      if (!synth) {
        console.error('Speech synthesis not supported');
        return;
      }

      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;

      const allVoices = voices.length > 0 ? voices : synth.getVoices();
      const langPrefix = language.split('-')[0].toLowerCase();

      // Filter voices by language
      const langVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));

      // Enhanced female voice detection keywords
      const preferredKeywords = ['female', 'woman', 'google'];
      const femaleIdentifiers = ['female', 'woman', ];

      // First try to find a high-quality female voice
      let selectedVoice = langVoices.find(v =>
        v.name.toLowerCase().includes('google') &&
        femaleIdentifiers.some(keyword => v.name.toLowerCase().includes(keyword))
      );

      // If no Google female voice, try any female voice
      if (!selectedVoice) {
        selectedVoice = langVoices.find(v =>
          femaleIdentifiers.some(keyword => v.name.toLowerCase().includes(keyword))
        );
      }

      // Fallback to any available voice in the correct language
      const fallbackVoice = langVoices[0] || allVoices[0];
      utterance.voice = selectedVoice || fallbackVoice;

      // Optimized voice parameters for clarity
      utterance.rate = 0.9;      // Slightly slower for better clarity
      utterance.pitch = 1.15;    // Slightly higher pitch for feminine voice
      utterance.volume = 1;      // Maximum volume
      
      // Add slight pause between sentences for better comprehension
      const formattedText = text.replace(/([.!?])\s*/g, '$1... ');
      utterance.text = formattedText;

      synth.speak(utterance);
    },
    [language, voices]
  );

  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcomeMessage = {
        type: 'bot',
        content: "Welcome! I'm Nisaa, your assistant from Raising 100X.",
        displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X.",
        isTyping: false
      };
      setMessages([welcomeMessage]);
      setTimeout(() => speak(welcomeMessage.content), 100);
    }
  }, [isVisible, messages.length, speak]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'bot' && !lastMessage.isTyping) {
      setTimeout(() => speak(lastMessage.content), 100);
    }
  }, [messages, speak]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    const newUserMessage = { type: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    setIsTyping(true);

    const simulatedResponse = {
      type: 'bot',
      content: "Hi Shareena, how can I help you today?",
      displayedContent: "Hi Shareena, how can I help you today?",
      isTyping: false
    };

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, simulatedResponse]);
    }, 1500);

    setUserMessage('');
  };

  useEffect(() => {
    if (currentTypingIndex >= 0 && messages[currentTypingIndex]?.isTyping) {
      const message = messages[currentTypingIndex];
      const fullText = message.content;
      let currentIndex = 0;

      const typeNextChar = () => {
        if (currentIndex <= fullText.length) {
          const chunkSize = 3;
          const nextIndex = Math.min(currentIndex + chunkSize, fullText.length);
          setMessages(prev => prev.map((msg, idx) =>
            idx === currentTypingIndex
              ? {
                ...msg,
                displayedContent: fullText.slice(0, nextIndex),
                isTyping: nextIndex < fullText.length
              }
              : msg
          ));
          currentIndex = nextIndex;
          typingTimeoutRef.current = setTimeout(typeNextChar, 15);
        } else {
          setMessages(prev => prev.map((msg, idx) =>
            idx === currentTypingIndex
              ? { ...msg, isTyping: false, displayedContent: fullText }
              : msg
          ));
          setCurrentTypingIndex(-1);
        }
      };

      typeNextChar();

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [currentTypingIndex, messages]);

  return (
    isVisible && (
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
          {messages.map((msg, index) => (
            <div key={index}>
              {msg.type === 'bot' ? (
                <div className="bot-message-container">
                  <div className="bot-avatar">
                    <img src="/nisaa.png" alt="Bot" />
                  </div>
                  <div className="bot-content">
                    <div className="message bot">
                      <span className="message-text">{msg.displayedContent}</span>
                      <button 
                        className="speak-button"
                        onClick={() => speak(msg.content)}
                        title="Click to hear this message"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="message user">{msg.content}</div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="typing-indicator-wrapper">
              <div className="bot-message-container">
                <div className="bot-avatar">
                  <img src="/nisaa.png" alt="Bot" />
                </div>
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            className="message-input"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            className={`send-button ${userMessage.trim() ? 'ready' : ''}`}
            onClick={handleSendMessage}
            disabled={!userMessage.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
          <button 
            className={`voice-button ${isListening ? 'listening' : ''}`}
            onClick={() => {
              if (isListening) {
                recognitionRef.current?.stop();
              } else {
                if (!recognitionRef.current) {
                  recognitionRef.current = new SpeechRecognition();
                  recognitionRef.current.continuous = false;
                  recognitionRef.current.lang = language;
                  recognitionRef.current.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    setUserMessage(transcript);
                  };
                  recognitionRef.current.onend = () => {
                    setIsListening(false);
                  };
                }
                recognitionRef.current.start();
                setIsListening(true);
              }
            }}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        </div>
      </div>
    )
  );
};

export default ChatBot2;
