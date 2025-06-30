import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeSpeechRecognition, testAPIConnection, supportedLanguages } from './chatUtils';
import { playVoice } from './elevenTTS';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const API_BASE = 'https://m-touch-labs.onrender.com/';

export const useChatBot = (isVisible) => {
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [micPermission, setMicPermission] = useState(null);
  const [language, setLanguage] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [mutedMessages, setMutedMessages] = useState(new Set());
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return;
    testAPIConnection();
    fetch(`${API_BASE}/generate_session`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setSessionId(data.session_id || `fallback-${Date.now()}`))
      .catch(() => setSessionId(`fallback-${Date.now()}`));
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcome = {
        id: 'welcome',
        type: 'bot',
        content: "Welcome! I'm Nisaa, your assistant from Raising 100X.",
        displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X.",
        isTyping: false,
      };
      setMessages([welcome]);
    }
  }, [isVisible, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentTypingIndex >= 0 && messages[currentTypingIndex]?.isTyping) {
      const message = messages[currentTypingIndex];
      const fullText = message.content;
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex <= fullText.length) {
          const nextIndex = Math.min(currentIndex + 3, fullText.length);
          setMessages(prev =>
            prev.map((msg, idx) =>
              idx === currentTypingIndex
                ? { ...msg, displayedContent: fullText.slice(0, nextIndex), isTyping: nextIndex < fullText.length }
                : msg
            )
          );
          currentIndex = nextIndex;
          typingTimeoutRef.current = setTimeout(typeNextChar, 15);
        } else {
          setMessages(prev =>
            prev.map((msg, idx) =>
              idx === currentTypingIndex
                ? { ...msg, isTyping: false, displayedContent: fullText }
                : msg
            )
          );
          setCurrentTypingIndex(-1);
        }
      };
      typeNextChar();
      return () => clearTimeout(typingTimeoutRef.current);
    }
  }, [currentTypingIndex, messages]);

  useEffect(() => {
    if (isVisible && inputMode === 'text' && !isTyping && !isListening) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isVisible, inputMode, isTyping, isListening]);

  useEffect(() => {
    if (inputMode === 'voice') {
      recognitionRef.current = initializeSpeechRecognition(language, setIsListening, setUserMessage);
    }
  }, [language, inputMode]);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim() || !sessionId) return;

    const messageToSend = userMessage.trim();
    setUserMessage('');
    const newUserMessage = { id: `user-${Date.now()}`, type: 'user', content: messageToSend };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    const languagePrefix = {
      'en': '',
      'hi': 'Respond in Hindi. ',
      'te': 'Respond in Telugu. ',
      'ta': 'Respond in Tamil. ',
      'bn': 'Respond in Bengali. ',
      'mr': 'Respond in Marathi. ',
      'kn': 'Respond in Kannada. ',
      'ml': 'Respond in Malayalam. ',
    };

    const baseLang = language.split('-')[0];
    const langInstruction = languagePrefix[baseLang] || '';
    const fullPrompt = langInstruction + messageToSend;

    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: fullPrompt,
        session_id: sessionId,
        language: baseLang,
      }),
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        const botResponse = data.response || data.message || data.text || data.content || "Sorry, I didn't understand that.";
        const botReply = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: botResponse,
          displayedContent: botResponse,
          isTyping: false,
        };
        setMessages(prev => [...prev, botReply]);
        playVoice(botResponse, baseLang);
      })
      .catch(err => {
        const errorMessage = err.message.includes('Failed to fetch')
          ? "Network error. Please check your internet connection."
          : err.message.includes('HTTP error')
          ? "Server error. Please try again in a moment."
          : err.message.includes('JSON')
          ? "Invalid response from server. Please try again."
          : "Oops! Something went wrong. Please try again later.";
        setMessages(prev => [...prev, {
          id: `bot-error-${Date.now()}`,
          type: 'bot',
          content: errorMessage,
          displayedContent: errorMessage,
          isTyping: false,
        }]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  }, [userMessage, sessionId, language]);

  const handleVoiceButtonClick = useCallback(() => {
    if (inputMode === 'text') {
      setInputMode('voice');
      recognitionRef.current = initializeSpeechRecognition(language, setIsListening, setUserMessage);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setInputMode('text');
      }
    } else {
      if (isListening) {
        recognitionRef.current?.stop();
        setTimeout(() => setInputMode('text'), 200);
      } else {
        recognitionRef.current = initializeSpeechRecognition(language, setIsListening, setUserMessage);
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setInputMode('text');
        }
      }
    }
  }, [inputMode, isListening, language]);

  return {
    userMessage,
    setUserMessage,
    messages,
    setMessages,
    micPermission,
    setMicPermission,
    language,
    setLanguage,
    isListening,
    setIsListening,
    currentTypingIndex,
    setCurrentTypingIndex,
    isTyping,
    setIsTyping,
    sessionId,
    setSessionId,
    inputMode,
    setInputMode,
    mutedMessages,  
    setMutedMessages,
    recognitionRef,
    messagesEndRef,
    typingTimeoutRef,
    inputRef,
    handleSendMessage,
    handleVoiceButtonClick,
  };
};