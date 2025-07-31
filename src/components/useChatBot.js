// src/components/useChatBot.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { initializeSpeechRecognition, testAPIConnection } from './chatUtils';

const API_BASE = 'http://127.0.0.1:5000';

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

  const sendToServer = useCallback((messageToSend) => {
    if (!messageToSend.trim() || !sessionId) return;

    const newUserMessage = { id: `user-${Date.now()}`, type: 'user', content: messageToSend };
    setMessages(prev => [...prev, newUserMessage]);
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
      console.log('Server response:', data);
      
      const botMessageObj = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: data.response,
        displayedContent: data.response,
        audioUrl: data.audio_url,
        isTyping: false,
      };

      console.log('Created bot message:', botMessageObj);
      setMessages(prev => [...prev, botMessageObj]);
      
      // Try to play audio from server URL first, then fallback to TTS
      if (data.audio_url && !mutedMessages.has(botMessageObj.id)) {
        console.log('Playing audio from server URL:', data.audio_url);
        playAudioFromURL(data.audio_url, botMessageObj.id);
      } else {
        console.log('No audio URL from server, will use TTS fallback in ChatBot2');
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
    sendToServer(transcript);
    setUserMessage('');
    setInputMode('text');
  }, [sendToServer]);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim()) return;
    sendToServer(userMessage.trim());
    setUserMessage('');
  }, [userMessage, sendToServer]);

  // Fixed voice button click handler
  const handleVoiceButtonClick = useCallback(() => {
    console.log('Voice button clicked, isListening:', isListening);
    
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
      try {
        recognitionRef.current = initializeSpeechRecognition(
          selectedLanguage === 'en' ? 'en-IN' : selectedLanguage, 
          setIsListening, 
          handleTranscript
        );
        
        if (recognitionRef.current) {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setInputMode('text');
        }
      }
    }
  }, [inputMode, isListening, handleTranscript, selectedLanguage]);

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

  useEffect(() => {
    if (inputMode === 'voice') {
      recognitionRef.current = initializeSpeechRecognition(selectedLanguage === 'en' ? 'en-IN' : selectedLanguage, setIsListening, handleTranscript);
    }
  }, [inputMode, handleTranscript, selectedLanguage]);

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