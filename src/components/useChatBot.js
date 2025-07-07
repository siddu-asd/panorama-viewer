import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeSpeechRecognition, testAPIConnection } from './chatUtils';

const API_BASE = 'http://localhost:5000';

export const useChatBot = (isVisible, selectedLanguage = 'en') => {
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const [mutedMessages, setMutedMessages] = useState(new Set());

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null); // 👈 For stopping audio

  const playAudioFromURL = (url, messageId) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (mutedMessages.has(messageId)) return;

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    audio.play().catch(err => {
      console.error('Audio playback failed:', err.message);
    });
  };

  const sendToServer = useCallback((messageToSend) => {
    if (!messageToSend.trim() || !sessionId) return;

    const newUserMessage = { id: `user-${Date.now()}`, type: 'user', content: messageToSend };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageToSend,
        session_id: sessionId,
        language: selectedLanguage,
      }),
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        const botResponse = data.response || "Sorry, I didn't understand that.";
        const audioUrl = data.audio_url || null;
        const botId = `bot-${Date.now()}`;

        const botReply = {
          id: botId,
          type: 'bot',
          content: botResponse,
          displayedContent: botResponse,
          isTyping: false,
          image: data.image,   // Pass image from backend
          url: data.url,       // Pass url from backend
          label: data.label    // Pass label from backend
        };

        setMessages(prev => [...prev, botReply]);

        if (audioUrl) {
          playAudioFromURL(audioUrl, botId);
        }
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
  }, [sessionId, mutedMessages, selectedLanguage]);

  const handleTranscript = useCallback((transcript) => {
    sendToServer(transcript);
    setUserMessage('');
    setInputMode('text');
  }, [sendToServer]);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim()) return;
    sendToServer(userMessage.trim());
    setUserMessage('');
  }, [userMessage, sendToServer]);

  const handleVoiceButtonClick = useCallback(() => {
    if (inputMode === 'text') {
      setInputMode('voice');
      recognitionRef.current = initializeSpeechRecognition('en-IN', setIsListening, handleTranscript);
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
        recognitionRef.current = initializeSpeechRecognition('en-IN', setIsListening, handleTranscript);
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setInputMode('text');
        }
      }
    }
  }, [inputMode, isListening, handleTranscript]);

  const handleSpeakerClick = useCallback((messageId) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const isMutedNow = mutedMessages.has(messageId);
    const updatedMuted = new Set(mutedMessages);

    if (isMutedNow) {
      updatedMuted.delete(messageId);
      if (message.audioUrl) playAudioFromURL(message.audioUrl, messageId);
    } else {
      updatedMuted.add(messageId);
      if (audioRef.current) audioRef.current.pause();
    }

    setMutedMessages(updatedMuted);
  }, [messages, mutedMessages]);

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
    if (isVisible && inputMode === 'text' && !isTyping && !isListening) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isVisible, inputMode, isTyping, isListening]);

  useEffect(() => {
    if (inputMode === 'voice') {
      recognitionRef.current = initializeSpeechRecognition('en-IN', setIsListening, handleTranscript);
    }
  }, [inputMode, handleTranscript]);

  return {
    userMessage,
    setUserMessage,
    messages,
    isListening,
    isTyping,
    inputMode,
    mutedMessages,
    handleSendMessage,
    handleVoiceButtonClick,
    handleSpeakerClick,
    inputRef,
    messagesEndRef
  };
};
