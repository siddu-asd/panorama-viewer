import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeSpeechRecognition, testAPIConnection, supportedLanguages } from './chatUtils';

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

  // Generate session ID
  useEffect(() => {
    if (!isVisible) return;
    testAPIConnection();
    fetch(`${API_BASE}/generate_session`)
      .then((res) => {
        if (!res.ok) throw new Error(`Session generation failed! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.session_id) {
          setSessionId(data.session_id);
        } else {
          setSessionId(`fallback-${Date.now()}`);
        }
      })
      .catch(() => {
        setSessionId(`fallback-${Date.now()}`);
      });
  }, [isVisible]);

  // Welcome message
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcome = {
        id: 'welcome',
        type: 'bot',
        content: "Welcome! I'm Nisaa, your assistant from Raising 100X. Say or type 'change language to [language]' to switch languages.",
        displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X. Say or type 'change language to [language]' to switch languages.",
        isTyping: false,
      };
      setMessages([welcome]);
    }
  }, [isVisible, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing effect
  useEffect(() => {
    if (currentTypingIndex >= 0 && messages[currentTypingIndex]?.isTyping) {
      const message = messages[currentTypingIndex];
      const fullText = message.content;
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex <= fullText.length) {
          const nextIndex = Math.min(currentIndex + 3, fullText.length);
          setMessages((prev) =>
            prev.map((msg, idx) =>
              idx === currentTypingIndex
                ? {
                    ...msg,
                    displayedContent: fullText.slice(0, nextIndex),
                    isTyping: nextIndex < fullText.length,
                  }
                : msg
            )
          );
          currentIndex = nextIndex;
          typingTimeoutRef.current = setTimeout(typeNextChar, 15);
        } else {
          setMessages((prev) =>
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

  // Auto-focus input
  useEffect(() => {
    if (isVisible && inputMode === 'text' && !isTyping && !isListening) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isVisible, inputMode, isTyping, isListening]);

  // Reinitialize speech recognition when language changes
  useEffect(() => {
    if (inputMode === 'voice') {
      recognitionRef.current = initializeSpeechRecognition(language, setIsListening, setUserMessage);
    }
  }, [language, inputMode]);

  const detectLanguageChange = useCallback((message) => {
    const lowerMessage = message.toLowerCase().trim();
    const langKey = Object.keys(supportedLanguages).find((key) =>
      supportedLanguages[key].keywords.some((kw) => lowerMessage.includes(kw.toLowerCase()))
    );
    return langKey ? supportedLanguages[langKey].code : null;
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim() || !sessionId) return;
    const messageToSend = userMessage.trim();
    setUserMessage('');
    const newLanguage = detectLanguageChange(messageToSend);

    if (newLanguage) {
      setLanguage(newLanguage);
      const langName = Object.keys(supportedLanguages).find(
        (key) => supportedLanguages[key].code === newLanguage
      );
      const botReply = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: `Language changed to ${langName.charAt(0).toUpperCase() + langName.slice(1)}.`,
        displayedContent: `Language changed to ${langName.charAt(0).toUpperCase() + langName.slice(1)}.`,
        isTyping: false,
      };
      setMessages((prev) => [...prev, { id: `user-${Date.now()}`, type: 'user', content: messageToSend }, botReply]);
      return;
    }

    const newUserMessage = { id: `user-${Date.now()}`, type: 'user', content: messageToSend };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsTyping(true);

    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageToSend, session_id: sessionId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const botResponse = data.response || data.message || data.text || data.content || "Sorry, I didn't understand that.";
        const botReply = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: botResponse,
          displayedContent: botResponse,
          isTyping: false,
        };
        setMessages((prev) => [...prev, botReply]);
      })
      .catch((err) => {
        let errorMessage = "Oops! Something went wrong. Please try again later.";
        if (err.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (err.message.includes('HTTP error')) {
          errorMessage = "Server error. Please try again in a moment.";
        } else if (err.message.includes('JSON')) {
          errorMessage = "Invalid response from server. Please try again.";
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-error-${Date.now()}`,
            type: 'bot',
            content: errorMessage,
            displayedContent: errorMessage,
            isTyping: false,
          },
        ]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  }, [userMessage, sessionId, inputMode, detectLanguageChange]);

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
