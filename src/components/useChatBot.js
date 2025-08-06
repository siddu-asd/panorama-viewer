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
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

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
      setCurrentlyPlaying(messageId);
    });
    audio.addEventListener('ended', () => {
      console.log('Audio finished playing');
      setIsAudioPlaying(false);
      setCurrentlyPlaying(null);
      audioRef.current = null;
    });
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setIsAudioPlaying(false);
      // Fallback to browser speech synthesis with female voice
      console.log('Trying browser speech synthesis with female voice...');
      
      // Find the bot message and play it with speech synthesis
      const message = messages.find(m => m.id === messageId);
      if (message && message.content && 'speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices for fallback:', voices.map(v => `${v.name} (${v.lang}) - ${v.voiceURI}`));
        
        // Only use 3 best female voices - no male voices
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
          console.log('Found Lisa voice for fallback:', selectedVoice.name);
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
            console.log('Found Serena voice for fallback:', selectedVoice.name);
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
            console.log('Found Karen voice for fallback:', selectedVoice.name);
          }
        }
        
        // 4. If no specific voices, find ANY female voice (no male voices)
        if (!selectedVoice) {
          console.log('Looking for any female voice for fallback...');
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
            console.log('Found female voice for fallback:', selectedVoice.name);
          }
        }
        
        // Only proceed if we have a female voice
        if (selectedVoice) {
          const utterance = new SpeechSynthesisUtterance(message.content);
          utterance.lang = 'en-US';
          utterance.volume = 1.0; // Full volume for clarity
          utterance.rate = 0.9; // Slightly slower for sweetness and clarity
          utterance.pitch = 1.1; // Slightly higher pitch for sweetness
          
          utterance.voice = selectedVoice;
          console.log('Using selected female voice for fallback:', selectedVoice.name, selectedVoice.lang);
        
        // Update audio playing state for speech synthesis
        utterance.onstart = () => {
          setIsAudioPlaying(true);
          setCurrentlyPlaying(messageId);
        };
        utterance.onend = () => {
          setIsAudioPlaying(false);
          setCurrentlyPlaying(null);
        };
        
        // Stop any current speech
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
        } else {
          console.log('NO FEMALE VOICE FOUND FOR FALLBACK - NOT SPEAKING TO AVOID MALE VOICE');
        }
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
      setCurrentlyPlaying(null);
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      setCurrentlyPlaying(null);
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
      
      // Try to play audio from server URL first, then fallback to TTS
      if (data.audio_url && !mutedMessages.has(botMessageObj.id)) {
        console.log('Playing audio from server URL:', data.audio_url);
        playAudioFromURL(data.audio_url, botMessageObj.id);
      } else if (!mutedMessages.has(botMessageObj.id)) {
        console.log('No audio URL from server, TTS will be handled by ChatBot2.js');
        // TTS is now handled by ChatBot2.js useEffect to avoid conflicts
        /*
        console.log('No audio URL from server, using TTS directly');
        // Use TTS directly since no server audio URL
        if ('speechSynthesis' in window) {
          const voices = speechSynthesis.getVoices();
          console.log('Available voices for TTS:', voices.map(v => `${v.name} (${v.lang}) - ${v.voiceURI}`));
          
          // Only use 3 best female voices - no male voices
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
            console.log('Found Lisa voice for TTS:', selectedVoice.name);
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
              console.log('Found Serena voice for TTS:', selectedVoice.name);
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
              console.log('Found Karen voice for TTS:', selectedVoice.name);
            }
          }
          
          // 4. If no specific voices, find ANY female voice (no male voices)
          if (!selectedVoice) {
            console.log('Looking for any female voice for TTS...');
            selectedVoice = voices.find(voice => {
              const voiceName = voice.name.toLowerCase();
              const voiceURI = voice.voiceURI.toLowerCase();
              
              // Skip male voices
              if (voiceName.includes('david') || voiceName.includes('james') || 
                  voiceName.includes('john') || voiceName.includes('mike') || 
                  voiceName.includes('tom') || voiceName.includes('male') ||
                  voiceURI.includes('david') || voiceURI.includes('james') ||
                  voiceURI.includes('john') || voiceURI.includes('mike') ||
                  voiceURI.includes('tom') || voiceURI.includes('male')) {
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
                 voiceURI.includes('samantha') ||
                 voiceURI.includes('victoria') ||
                 voiceURI.includes('tessa') ||
                 voiceURI.includes('eva'))
              );
            });
            if (selectedVoice) {
              console.log('Found female voice for TTS:', selectedVoice.name);
            }
          }
          
          // Only proceed if we have a female voice
          if (selectedVoice) {
            const utterance = new SpeechSynthesisUtterance(data.response);
            utterance.lang = 'en-US';
            utterance.volume = 1.0; // Full volume for clarity
            utterance.rate = 0.9; // Slightly slower for sweetness and clarity
            utterance.pitch = 1.1; // Slightly higher pitch for sweetness
            
            utterance.voice = selectedVoice;
            console.log('Using selected female voice for TTS:', selectedVoice.name, selectedVoice.lang);
            
            utterance.onstart = () => {
              setIsAudioPlaying(true);
              setCurrentlyPlaying(botMessageObj.id);
            };
            utterance.onend = () => {
              setIsAudioPlaying(false);
              setCurrentlyPlaying(null);
            };
            
            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
            console.log('TTS initiated with female voice');
      } else {
            console.log('NO FEMALE VOICE FOUND FOR TTS - NOT SPEAKING TO AVOID MALE VOICE');
          }
        }
        */
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

  // Handle microphone icon click to toggle speech recognition
  const handleVoiceButtonClick = useCallback(() => {
    console.log('Voice button clicked, isListening:', isListening);
    
    if (isListening) {
      // Stop speech recognition
      console.log('Stopping speech recognition');
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      // Stop any ongoing audio playback and start speech recognition
      console.log('Starting speech recognition');
      stopAudioPlayback(); // Stop any bot voice playback
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
    const isCurrentlyPlaying = currentlyPlaying === messageId;
    const updatedMuted = new Set(mutedMessages);

    console.log('Speaker click:', {
      messageId,
      isMutedNow,
      isCurrentlyPlaying,
      isAudioPlaying
    });

    // If message is currently playing, stop it
    if (isCurrentlyPlaying) {
      console.log('Stopping currently playing message');
      stopAudioPlayback();
      return;
    }

    if (isMutedNow) {
      // Message is muted - unmute and play
      console.log('Unmuting and playing message');
      updatedMuted.delete(messageId);
      setMutedMessages(updatedMuted);
      
      if (message.audioUrl) {
        playAudioFromURL(message.audioUrl, messageId);
      } else if (message.content && 'speechSynthesis' in window) {
        // Use browser speech synthesis for messages without server audio
        const voices = speechSynthesis.getVoices();
        console.log('Available voices for playback:', voices.map(v => `${v.name} (${v.lang}) - ${v.voiceURI}`));
        
        // Only use 3 best female voices - no male voices
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
          console.log('Found Lisa voice for playback:', selectedVoice.name);
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
            console.log('Found Serena voice for playback:', selectedVoice.name);
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
            console.log('Found Karen voice for playback:', selectedVoice.name);
          }
        }
        
        // 4. If no specific voices, find ANY female voice (no male voices)
        if (!selectedVoice) {
          console.log('Looking for any female voice for playback...');
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
            console.log('Found female voice for playback:', selectedVoice.name);
          }
        }
        
        // Only proceed if we have a female voice
        if (selectedVoice) {
          const utterance = new SpeechSynthesisUtterance(message.content);
          utterance.lang = 'en-US';
          utterance.volume = 1.0; // Full volume for clarity
          utterance.rate = 0.9; // Slightly slower for sweetness and clarity
          utterance.pitch = 1.1; // Slightly higher pitch for sweetness
          
          utterance.voice = selectedVoice;
          console.log('Using selected female voice for playback:', selectedVoice.name, selectedVoice.lang);
        
        utterance.onstart = () => {
          setIsAudioPlaying(true);
          setCurrentlyPlaying(messageId);
        };
        utterance.onend = () => {
          setIsAudioPlaying(false);
          setCurrentlyPlaying(null);
        };
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
        } else {
          console.log('NO FEMALE VOICE FOUND FOR PLAYBACK - NOT SPEAKING TO AVOID MALE VOICE');
        }
      }
    } else {
      // Message is not muted - mute it (first click behavior)
      console.log('Muting message (first click)');
      updatedMuted.add(messageId);
      setMutedMessages(updatedMuted);
      stopAudioPlayback();
    }
  }, [messages, mutedMessages, currentlyPlaying]);

  // Initialize session and test API connection
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

  // Display welcome message when chat is visible and no messages exist
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

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when visible and in text mode
  useEffect(() => {
    if (isVisible && inputMode === 'text' && !isTyping && !isListening) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isVisible, inputMode, isTyping, isListening]);

  // Cleanup speech recognition and audio when component unmounts
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
    setMutedMessages,
    currentlyPlaying,
    handleSendMessage,
    handleVoiceButtonClick,
    handleSpeakerClick,
    inputRef,
    messagesEndRef,
  };
};