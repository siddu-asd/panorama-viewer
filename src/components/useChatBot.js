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
    console.log('playAudioFromURL called with:', url, messageId);
    
    if (audioRef.current) {
      console.log('Stopping previous audio');
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (mutedMessages.has(messageId)) {
      console.log('Message is muted, not playing audio');
      return;
    }

    console.log('Creating new audio element for URL:', url);
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    
    // Set audio properties for better quality
    audio.volume = 0.9; // Higher volume for better clarity
    audio.playbackRate = 1.0; // Normal speed
    
    // Add event listeners for debugging
    audio.addEventListener('loadstart', () => console.log('Audio loading started'));
    audio.addEventListener('canplay', () => console.log('Audio can play'));
    audio.addEventListener('play', () => console.log('Audio started playing'));
    audio.addEventListener('ended', () => console.log('Audio finished playing'));
    audio.addEventListener('error', (e) => console.error('Audio error:', e));
    
    audio.play().catch(err => {
      console.error('Audio playback failed:', err.message);
      // Fallback to browser speech synthesis with aggressive female voice search
      console.log('Trying browser speech synthesis with aggressive female voice search...');
      
      // Find the bot message and play it with speech synthesis
      const message = messages.find(m => m.id === messageId);
      if (message && message.content && 'speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices for fallback:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Aggressive female voice search
        const femaleVoice = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          const voiceURI = voice.voiceURI.toLowerCase();
          return (
            voice.lang.startsWith('en') &&
            (voiceName.includes('female') ||
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
             voiceURI.includes('victoria'))
          );
        });
        
        // If no female voice, try any voice that's not obviously male
        const nonMaleVoice = !femaleVoice ? voices.find(voice => {
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
        }) : null;
        
        const selectedVoice = femaleVoice || nonMaleVoice;
        
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = 'en-US';
        utterance.volume = 0.9;
        utterance.rate = 0.85; // Slightly slower for more natural sound
        utterance.pitch = 1.2; // Higher pitch for female voice
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
        } else {
          console.log('No suitable voice found, using default');
        }
        
        // Stop any current speech
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      }
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