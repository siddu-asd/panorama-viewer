// src/components/useChatBot.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeSpeechRecognition, testAPIConnection } from './chatUtils';

const API_BASE = 'http://192.168.202.82:5000';

export const useChatBot = (isVisible, selectedLanguage = 'en', switchToScene) => {
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [mutedMessages, setMutedMessages] = useState(new Set());

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);

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

  const sendToServer = useCallback(async (messageToSend) => {
    if (!messageToSend.trim() || !sessionId) return;

    const userMessageObj = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageToSend.trim(),
      displayedContent: messageToSend.trim(),
    };

    setMessages(prev => [...prev, userMessageObj]);
    setUserMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend.trim(),
          session_id: sessionId,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessageObj = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: data.response,
        displayedContent: data.response,
        audioUrl: data.audio_url,
        isTyping: false,
      };

      setMessages(prev => [...prev, botMessageObj]);
      
      if (data.audio_url && !mutedMessages.has(botMessageObj.id)) {
        playAudioFromURL(data.audio_url, botMessageObj.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessageObj = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        displayedContent: 'Sorry, I encountered an error. Please try again.',
        isTyping: false,
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, selectedLanguage, mutedMessages]);

  const handleTranscript = useCallback((transcript) => {
    console.log('Transcript received:', transcript);
    if (transcript && transcript.trim()) {
      // Set the user message first so it shows in the input
      setUserMessage(transcript.trim());
      // Then send it to the server
      sendToServer(transcript.trim());
    }
    setIsListening(false);
  }, [sendToServer]);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim()) return;
    sendToServer(userMessage.trim());
  }, [userMessage, sendToServer]);

  // Simplified voice button click handler
  const handleVoiceButtonClick = useCallback(async () => {
    console.log('Voice button clicked, current state:', { isListening, inputMode });
    
    if (isListening) {
      // Stop listening
      console.log('Stopping speech recognition');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Start listening
      console.log('Starting speech recognition');
      
      // First request microphone permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        alert('Microphone permission is required for voice features.');
        return;
      }
      
      try {
        recognitionRef.current = initializeSpeechRecognition(
          selectedLanguage === 'en' ? 'en-IN' : selectedLanguage, 
          setIsListening, 
          handleTranscript
        );
        
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
          console.log('Speech recognition started successfully');
        } else {
          console.error('Speech recognition not available');
          alert('Speech recognition is not supported in this browser.');
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        alert('Error starting speech recognition. Please try again.');
      }
    }
  }, [isListening, selectedLanguage, handleTranscript]);

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
        content: "Welcome! I'm Nisaa, your assistant from Raising 100X. Ask me about our 360° office tour or anything else!",
        displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X. Ask me about our 360° office tour or anything else!",
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

  // Cleanup speech recognition when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
    messagesEndRef,
  };
};