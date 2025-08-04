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
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const selectedVoiceRef = useRef(null);

  // Initialize the selected voice on component mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Select only the "Samantha" voice for consistency
        const preferredVoice = voices.find(voice => {
          const voiceName = voice.name.toLowerCase();
          return voice.lang === 'en-US' && voiceName.includes('samantha');
        }) || voices.find(voice => voice.lang === 'en-US'); // Fallback to any en-US voice
        
        selectedVoiceRef.current = preferredVoice;
        console.log('Selected voice:', preferredVoice ? `${preferredVoice.name} (${preferredVoice.lang})` : 'None');
      };

      // Load voices immediately and when voices change
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
      
      return () => {
        speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const playAudioFromURL = (url, messageId) => {
    console.log('playAudioFromURL called with:', url, messageId);
    
    if (audioRef.current) {
      console.log('Stopping previous audio');
      audioRef.current.pause();
      audioRef.current = null;
      setIsAudioPlaying(false);
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
    
    // Add event listeners for debugging and state management
    audio.addEventListener('loadstart', () => console.log('Audio loading started'));
    audio.addEventListener('canplay', () => console.log('Audio can play'));
    audio.addEventListener('play', () => {
      console.log('Audio started playing');
      setIsAudioPlaying(true);
    });
    audio.addEventListener('ended', () => {
      console.log('Audio finished playing');
      setIsAudioPlaying(false);
      audioRef.current = null;
    });
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setIsAudioPlaying(false);
      // Fallback to browser speech synthesis with selected voice
      console.log('Trying browser speech synthesis with selected voice...');
      
      const message = messages.find(m => m.id === messageId);
      if (message && message.content && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = 'en-US';
        utterance.volume = 0.9;
        utterance.rate = 0.85; // Slightly slower for more natural sound
        utterance.pitch = 1.2; // Higher pitch for female voice
        
        if (selectedVoiceRef.current) {
          utterance.voice = selectedVoiceRef.current;
          console.log('Using selected voice:', selectedVoiceRef.current.name, selectedVoiceRef.current.lang);
        } else {
          console.log('No selected voice, using default');
        }
        
        utterance.onstart = () => setIsAudioPlaying(true);
        utterance.onend = () => setIsAudioPlaying(false);
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      }
    });
    
    audio.play().catch(err => {
      console.error('Audio playback failed:', err.message);
      setIsAudioPlaying(false);
    });
  };

  const stopAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsAudioPlaying(false);
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
    }
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
        image: data.image,
        url: data.url,
        label: data.label,
        isTyping: false,
      };

      console.log('Created bot message:', botMessageObj);
      setMessages(prev => [...prev, botMessageObj]);
      
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
      setUserMessage(transcript.trim());
      sendToServer(transcript.trim());
    }
    setIsListening(false);
  }, [sendToServer]);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim()) return;
    sendToServer(userMessage.trim());
  }, [userMessage, sendToServer]);

  const handleVoiceButtonClick = useCallback(() => {
    console.log('Voice button clicked, isListening:', isListening);
    
    if (isListening) {
      console.log('Stopping speech recognition');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      console.log('Starting speech recognition');
      stopAudioPlayback();
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

    if (isMutedNow || !isAudioPlaying) {
      updatedMuted.delete(messageId);
      setMutedMessages(updatedMuted);
      if (message.audioUrl) {
        playAudioFromURL(message.audioUrl, messageId);
      } else if (message.content && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = 'en-US';
        utterance.volume = 0.9;
        utterance.rate = 0.85;
        utterance.pitch = 1.2;
        
        if (selectedVoiceRef.current) {
          utterance.voice = selectedVoiceRef.current;
          console.log('Using selected voice:', selectedVoiceRef.current.name, selectedVoiceRef.current.lang);
        } else {
          console.log('No selected voice, using default');
        }
        
        utterance.onstart = () => setIsAudioPlaying(true);
        utterance.onend = () => setIsAudioPlaying(false);
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      }
    } else {
      updatedMuted.add(messageId);
      setMutedMessages(updatedMuted);
      stopAudioPlayback();
    }
  }, [messages, mutedMessages, isAudioPlaying]);

  useEffect(() => {
    if (!isVisible) return;
    testAPIConnection();
    fetch(`${API_BASE}/generate_session`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        const newSessionId = data.session_id || `fallback-${Date.now()}`;
        setSessionId(newSessionId);
        localStorage.setItem('chatSessionId', newSessionId);
      })
      .catch(() => {
        const fallbackId = `fallback-${Date.now()}`;
        setSessionId(fallbackId);
        localStorage.setItem('chatSessionId', fallbackId);
      });
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
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioPlayback();
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