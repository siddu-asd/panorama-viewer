import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/ChatBot2.css';
import BotResponse from './BotResponse'; // adjust the path if needed

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const supportedLanguages = {
  english: { code: 'en-US', name: 'English', keywords: ['english', 'speak in english', 'अंग्रेजी', 'हिंदी', 'தமிழ்', 'తెలుగు', 'ಕನ್ನಡ'] },
  hindi: { code: 'hi-IN', name: 'हिंदी (Hindi)', keywords: ['hindi', 'speak in hindi', 'हिंदी में बोलो'] },
  tamil: { code: 'ta-IN', name: 'தமிழ் (Tamil)', keywords: ['tamil', 'speak in tamil', 'தமிழில் பேசு'] },
  telugu: { code: 'te-IN', name: 'తెలుగు (Telugu)', keywords: ['telugu', 'speak in telugu', 'తెలుగులో మాట్లాడు'] },
  kannada: { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)', keywords: ['kannada', 'speak in kannada', 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ'] },
  bengali: { code: 'bn-IN', name: 'বাংলা (Bengali)', keywords: ['bengali', 'speak in bengali', 'বাংলায় কথা বলুন'] },
};

// Language detection patterns
const languagePatterns = {
  hindi: /[\u0900-\u097F]/,
  tamil: /[\u0B80-\u0BFF]/,
  telugu: /[\u0C00-\u0C7F]/,
  kannada: /[\u0C80-\u0CFF]/,
  bengali: /[\u0980-\u09FF]/,
  english: /^[a-zA-Z\s.,!?;:'"()-]+$/
};

// Function to detect language from text
const detectLanguage = (text) => {
  if (!text || text.trim().length === 0) return 'english';
  
  const cleanText = text.trim();
  
  // Check for specific language patterns
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(cleanText)) {
      return lang;
    }
  }
  
  // Default to English if no pattern matches
  return 'english';
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
  const [sessionId, setSessionId] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if chatbot is currently speaking
  const [mutedMessages, setMutedMessages] = useState(new Set()); // Track which messages are muted
  const [showLanguageSelector, setShowLanguageSelector] = useState(false); // Language selector visibility
  const [selectedLanguage, setSelectedLanguage] = useState('english'); // Current selected language
  const [messageOutputLanguages, setMessageOutputLanguages] = useState({}); // { [messageId]: langKey }
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const currentUtteranceRef = useRef(null); // Track current speech utterance

  const API_BASE = 'https://m-touch-labs.onrender.com/';

  // Test API connection
  const testAPIConnection = useCallback(() => {
    console.log('Testing API connection...');
    fetch(`${API_BASE}/health`)
      .then(res => {
        console.log('Health check status:', res.status);
        return res.text();
      })
      .then(data => {
        console.log('Health check response:', data);
      })
      .catch(err => {
        console.error('Health check failed:', err);
      });
  }, []);

  // Ensure input gets focus when visible and in text mode
  useEffect(() => {
    if (isVisible && inputMode === 'text') {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Auto-focused input field');
        }
      }, 100);
    }
  }, [isVisible, inputMode]);

  // Additional focus mechanism for after any state changes
  useEffect(() => {
    if (isVisible && inputMode === 'text' && !isTyping) {
      setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
          console.log('Re-focused input after state change');
        }
      }, 200);
    }
  }, [isVisible, inputMode, isTyping, messages.length]);

  // Special focus mechanism for after voice input mode changes
  useEffect(() => {
    if (isVisible && inputMode === 'text' && !isListening) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Focused input after voice mode change');
        }
      }, 300);
    }
  }, [isVisible, inputMode, isListening]);

  // Generate session ID once on mount
  useEffect(() => {
    console.log('Generating session ID...');
    console.log('API Base URL:', API_BASE);
    
    // Test API connection first
    testAPIConnection();
    
    fetch(`${API_BASE}/generate_session`)
      .then(res => {
        console.log('Session ID response status:', res.status);
        console.log('Session ID response headers:', res.headers);
        if (!res.ok) {
          throw new Error(`Session generation failed! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Session ID received:', data);
        
        if (data && data.session_id) {
          setSessionId(data.session_id);
          console.log('Session ID set successfully:', data.session_id);
        } else {
          console.error('Invalid session ID response:', data);
          // Set a fallback session ID
          const fallbackId = `fallback-${Date.now()}`;
          setSessionId(fallbackId);
          console.log('Using fallback session ID:', fallbackId);
        }
      })
      .catch(err => {
        console.error('Failed to generate session ID:', err);
        console.error('Session generation error details:', {
          message: err.message,
          stack: err.stack
        });
        // Set a fallback session ID to prevent blocking
        const fallbackId = `fallback-${Date.now()}`;
        setSessionId(fallbackId);
        console.log('Using fallback session ID due to error:', fallbackId);
      });
  }, [testAPIConnection]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      console.log('Available voices:', availableVoices.length);
      setVoices(availableVoices);
      
      // Test speech synthesis
      if (availableVoices.length > 0) {
        console.log('Testing speech synthesis...');
        const testUtterance = new SpeechSynthesisUtterance('Test');
        testUtterance.volume = 0; // Silent test
        synth.speak(testUtterance);
        console.log('Speech synthesis test completed');
      }
    };
    
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();
    return () => {
      if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text, messageId = null, overrideLangKey = null) => {
    if (!synth) {
      console.log('Speech synthesis not available');
      return;
    }
    // Don't speak if this specific message is muted
    if (messageId && mutedMessages.has(messageId)) {
      console.log('Message is muted, not speaking:', messageId);
      return;
    }
    // Determine language code
    let langKey = overrideLangKey;
    if (!langKey && messageId && messageOutputLanguages[messageId]) {
      langKey = messageOutputLanguages[messageId];
    }
    if (!langKey) langKey = selectedLanguage;
    const langCode = supportedLanguages[langKey]?.code || 'en-US';
    console.log('Speaking message:', text, 'Message ID:', messageId, 'Lang:', langKey, langCode);
    // Stop any current speech
    synth.cancel();
    setIsSpeaking(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    const allVoices = voices.length > 0 ? voices : synth.getVoices();
    console.log('All available voices:', allVoices.map(v => ({ name: v.name, lang: v.lang })));
    const langPrefix = langCode.split('-')[0].toLowerCase();
    const langVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
    const preferredKeywords = ['female', 'woman', 'google'];
    const femaleVoice = langVoices.find(v => preferredKeywords.some(k => v.name.toLowerCase().includes(k)));
    const fallbackVoice = langVoices[0] || allVoices[0];
    utterance.voice = femaleVoice || fallbackVoice;
    console.log('Selected voice:', utterance.voice ? { name: utterance.voice.name, lang: utterance.voice.lang } : null);
    if (!langVoices.length) {
      alert(`Sorry, your browser does not support speech synthesis for the selected language (${langCode}). It will fall back to English or another available voice.`);
    }
    utterance.rate = 0.9;
    utterance.pitch = 1.15;
    utterance.volume = 1;
    utterance.text = text.replace(/([.!?])\s*/g, '$1... ');
    // Track speech events
    utterance.onstart = () => {
      setIsSpeaking(true);
      currentUtteranceRef.current = utterance;
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    try {
      synth.speak(utterance);
    } catch (error) {
      setIsSpeaking(false);
    }
  }, [selectedLanguage, voices, mutedMessages, messageOutputLanguages]);

  // Stop current speech
  const stopSpeaking = useCallback(() => {
    if (synth) {
      console.log('Stopping speech');
      synth.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  // Toggle mute for a specific message
  const toggleMessageMute = useCallback((messageId) => {
    console.log('Toggling mute for message:', messageId);
    
    setMutedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        console.log('Removing message from muted set:', messageId);
        newSet.delete(messageId);
      } else {
        console.log('Adding message to muted set:', messageId);
        newSet.add(messageId);
      }
      console.log('After toggle - muted messages:', Array.from(newSet));
      return newSet;
    });
  }, []);

  // Manually speak a specific message
  const speakMessage = useCallback((messageId) => {
    const message = messages.find(msg => msg.id === messageId);
    console.log('Attempting to speak message:', messageId);
    console.log('Message found:', !!message);
    console.log('Is message muted?', mutedMessages.has(messageId));
    
    if (message && !mutedMessages.has(messageId)) {
      console.log('Speaking message:', messageId);
      speak(message.content, messageId, messageOutputLanguages[messageId] || selectedLanguage);
    } else {
      console.log('Cannot speak message:', messageId, 'Muted:', mutedMessages.has(messageId));
    }
  }, [messages, mutedMessages, speak, messageOutputLanguages, selectedLanguage]);

  // Handle speaker button click - separate from input mode
  const handleSpeakerClick = useCallback((messageId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Speaker button clicked for message:', messageId);
    
    // Use a function to check current state to avoid stale closure issues
    setMutedMessages(prevMutedMessages => {
      const isCurrentlyMuted = prevMutedMessages.has(messageId);
      
      if (isCurrentlyMuted) {
        // If muted, just unmute (don't speak automatically)
        console.log('Unmuting message:', messageId);
        const newSet = new Set(prevMutedMessages);
        newSet.delete(messageId);
        return newSet;
      } else {
        // If not muted, mute the message and stop any current speech
        console.log('Muting message:', messageId);
        const newSet = new Set(prevMutedMessages);
        newSet.add(messageId);
        
        // Stop current speech if this message is being spoken
        if (isSpeaking) {
          stopSpeaking();
        }
        
        return newSet;
      }
    });
    
    // Ensure input remains focused after speaker interaction
    setTimeout(() => {
      if (inputRef.current && inputMode === 'text') {
        inputRef.current.focus();
        console.log('Refocused input after speaker interaction');
      }
    }, 50);
  }, [isSpeaking, stopSpeaking, inputMode]);

  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcomeMessages = {
        english: "Welcome! I'm Nisaa, your assistant from Raising 100X.",
        hindi: "स्वागत है! मैं निसा हूँ, Raising 100X से आपकी सहायक।",
        tamil: "வரவேற்கிறேன்! நான் நிசா, Raising 100X இலிருந்து உங்கள் உதவியாளர்.",
        telugu: "స్వాగతం! నేను నిసా, Raising 100X నుండి మీ సహాయకురాలు.",
        kannada: "ಸುಸ್ವಾಗತ! ನಾನು ನಿಸಾ, Raising 100X ನಿಂದ ನಿಮ್ಮ ಸಹಾಯಕಿ.",
        bengali: "স্বাগতম! আমি নিসা, Raising 100X থেকে আপনার সহকারী।"
      };
      
      const welcome = {
        id: 'welcome',
        type: 'bot',
        content: welcomeMessages[selectedLanguage] || welcomeMessages.english,
        displayedContent: welcomeMessages[selectedLanguage] || welcomeMessages.english,
        isTyping: false
      };
      setMessages([welcome]);
      setTimeout(() => speak(welcome.content, welcome.id, messageOutputLanguages[welcome.id] || selectedLanguage), 100);
    }
  }, [isVisible, messages.length, speak, selectedLanguage, messageOutputLanguages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.type === 'bot' && !last.isTyping) {
      setTimeout(() => speak(last.content, last.id, messageOutputLanguages[last.id] || selectedLanguage), 100);
    }
  }, [messages, speak, selectedLanguage, messageOutputLanguages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced send message function with language support
  const handleSendMessage = useCallback(() => {
    console.log('handleSendMessage called with:', { userMessage, sessionId, inputMode });
    
    // Always allow sending if there's a message, regardless of other states
    if (!userMessage.trim()) {
      console.log('No message to send - userMessage is empty or whitespace');
      return;
    }
    
    if (!sessionId) {
      console.log('No sessionId available - cannot send message');
      return;
    }

    // Stop any current speech immediately to free up input
    if (isSpeaking) {
      console.log('Stopping current speech to allow new input');
      stopSpeaking();
    }

    const messageToSend = userMessage.trim(); // Store the message before clearing
    console.log('Sending message:', messageToSend);
    
    // Detect language from user input
    const detectedLanguage = detectLanguage(messageToSend);
    console.log('Detected language from input:', detectedLanguage);
    
    // Update selected language if different from detected
    if (detectedLanguage !== selectedLanguage) {
      console.log('Auto-updating language from', selectedLanguage, 'to', detectedLanguage);
      setSelectedLanguage(detectedLanguage);
      setLanguage(supportedLanguages[detectedLanguage]?.code || 'en-US');
    }
    
    // Clear input immediately and ensure it's ready for new input
    setUserMessage('');
    
    // Force focus back to input after clearing
    setTimeout(() => {
      if (inputRef.current && inputMode === 'text') {
        inputRef.current.focus();
      }
    }, 10);

    const newUserMessage = { 
      id: `user-${Date.now()}`,
      type: 'user', 
      content: messageToSend
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    // Enhanced API call with language information
    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: messageToSend, 
        session_id: sessionId,
        language: detectedLanguage, // Send detected language to backend
        user_language_preference: selectedLanguage // Send user's language preference
      })
    })
      .then(res => {
        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Bot response received:', data);
        
        // Check if the response has the expected structure
        let botResponse = "Sorry, I didn't understand that.";
        
        if (data && typeof data === 'object') {
          // Try different possible response formats
          if (data.response) {
            botResponse = data.response;
          } else if (data.message) {
            botResponse = data.message;
          } else if (data.text) {
            botResponse = data.text;
          } else if (data.content) {
            botResponse = data.content;
          } else if (typeof data === 'string') {
            botResponse = data;
          } else if (data.error) {
            botResponse = `Error: ${data.error}`;
          }
        } else if (typeof data === 'string') {
          botResponse = data;
        }
        
        console.log('Processed bot response:', botResponse);
        
        const botReply = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: botResponse,
          displayedContent: botResponse,
          isTyping: false
        };
        setMessages(prev => [...prev, botReply]);
        // Ensure input is ready before attempting to speak
        setTimeout(() => {
          // Only speak if not muted and input is not being used
          if (!mutedMessages.has(botReply.id)) {
            speak(botReply.content, botReply.id, messageOutputLanguages[botReply.id] || selectedLanguage);
          }
        }, 100);
      })
      .catch(err => {
        console.error("Backend error:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          sessionId: sessionId
        });
        
        let errorMessage = "Oops! Something went wrong. Please try again later.";
        
        if (err.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (err.message.includes('HTTP error')) {
          errorMessage = "Server error. Please try again in a moment.";
        } else if (err.message.includes('JSON')) {
          errorMessage = "Invalid response from server. Please try again.";
        }
        
        setMessages(prev => [...prev, {
          id: `bot-error-${Date.now()}`,
          type: 'bot',
          content: errorMessage,
          displayedContent: errorMessage,
          isTyping: false
        }]);
      })
      .finally(() => {
        setIsTyping(false);
        // Focus the input box after sending message
        setTimeout(() => {
          if (inputRef.current && inputMode === 'text') {
            inputRef.current.focus();
          }
        }, 50);
      });
  }, [userMessage, sessionId, speak, mutedMessages, inputMode, isSpeaking, stopSpeaking, selectedLanguage, messageOutputLanguages]);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setUserMessage(transcript);
      console.log('Transcript:', transcript);
      
      // Check for language change keywords
      const matchedLang = Object.entries(supportedLanguages).find(([_, langData]) =>
        langData.keywords.some((keyword) => transcript.includes(keyword.toLowerCase()))
      );

      if (matchedLang) {
        const langKey = matchedLang[0];
        const langData = matchedLang[1];
        console.log('Language change detected:', langKey);
        
        // Update language immediately
        setSelectedLanguage(langKey);
        setLanguage(langData.code);
        
        // Update recognition language
        recognition.lang = langData.code;
        
        // Stop current speech and speak confirmation
        stopSpeaking();
        
        const confirmations = {
          english: "Language changed to English",
          hindi: "भाषा हिंदी में बदल गई है",
          tamil: "மொழி தமிழுக்கு மாற்றப்பட்டது",
          telugu: "భాష తెలుగుకు మార్చబడింది",
          kannada: "ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ",
          bengali: "ভাষা বাংলায় পরিবর্তন করা হয়েছে"
        };
        
        const confirmation = confirmations[langKey] || confirmations.english;
        
        // Add language change message
        const langChangeMessage = {
          id: `lang-change-${Date.now()}`,
          type: 'bot',
          content: confirmation,
          displayedContent: confirmation,
          isTyping: false
        };
        
        setMessages(prev => [...prev, langChangeMessage]);
        
        // Speak the confirmation
        setTimeout(() => {
          speak(confirmation, langChangeMessage.id, messageOutputLanguages[langChangeMessage.id] || selectedLanguage);
        }, 100);
        
        // Clear the input since it was a language command
        setUserMessage('');
        return;
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert('Please allow microphone access to use voice input.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Speech recognition ended');
    };

    return recognition;
  }, [language]);

  // Handle voice button click with speech interruption protection
  const handleVoiceButtonClick = useCallback(() => {
    console.log('Voice button clicked. Current state:', { inputMode, isListening, isSpeaking });
    
    // If chatbot is currently speaking, stop it first
    if (isSpeaking) {
      console.log('Stopping chatbot speech');
      stopSpeaking();
      // Don't return here - allow the function to continue and handle input mode
    }

    if (inputMode === 'text') {
      // Switch to voice mode and start listening
      console.log('Switching to voice mode');
      setInputMode('voice');
      if (!recognitionRef.current) {
        recognitionRef.current = initializeSpeechRecognition();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          console.log('Speech recognition started');
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          // If voice recognition fails, switch back to text mode
          setInputMode('text');
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        }
      }
    } else {
      // In voice mode, toggle listening
      if (isListening) {
        console.log('Stopping speech recognition');
        recognitionRef.current?.stop();
        // Switch back to text mode when stopping voice input
        setTimeout(() => {
          console.log('Switching back to text mode after stopping voice');
          setInputMode('text');
          if (inputRef.current) {
            inputRef.current.focus();
            console.log('Focused input after stopping voice');
          }
        }, 200);
      } else {
        console.log('Starting speech recognition');
        if (!recognitionRef.current) {
          recognitionRef.current = initializeSpeechRecognition();
        }
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            console.log('Speech recognition started');
          } catch (error) {
            console.error('Error starting speech recognition:', error);
            // If voice recognition fails, switch back to text mode
            setInputMode('text');
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 100);
          }
        }
      }
    }
  }, [inputMode, isListening, isSpeaking, initializeSpeechRecognition, stopSpeaking]);

  // Switch back to text mode manually
  const switchToTextMode = useCallback(() => {
    console.log('Switching to text mode');
    setInputMode('text');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Focus the input field when switching to text mode
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  // Auto-send message when voice input is complete
  useEffect(() => {
    if (inputMode === 'voice' && userMessage.trim() && !isListening) {
      console.log('Auto-sending voice message:', userMessage);
      // Small delay to ensure the transcript is complete
      const timer = setTimeout(() => {
        const messageToSend = userMessage.trim();
        setUserMessage(''); // Clear input immediately
        
        // Detect language from voice input
        const detectedLanguage = detectLanguage(messageToSend);
        console.log('Detected language from voice input:', detectedLanguage);
        
        // Update selected language if different from detected
        if (detectedLanguage !== selectedLanguage) {
          console.log('Auto-updating language from', selectedLanguage, 'to', detectedLanguage);
          setSelectedLanguage(detectedLanguage);
          setLanguage(supportedLanguages[detectedLanguage]?.code || 'en-US');
        }
        
        const newUserMessage = { 
          id: `user-${Date.now()}`,
          type: 'user', 
          content: messageToSend
        };
        setMessages(prev => [...prev, newUserMessage]);
        setIsTyping(true);

        // Enhanced API call with language information for voice input
        fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: messageToSend, 
            session_id: sessionId,
            language: detectedLanguage, // Send detected language to backend
            user_language_preference: selectedLanguage, // Send user's language preference
            input_type: 'voice' // Indicate this is voice input
          })
        })
          .then(res => {
            console.log('Response status:', res.status);
            console.log('Response headers:', res.headers);
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('Bot response received:', data);
            
            // Check if the response has the expected structure
            let botResponse = "Sorry, I didn't understand that.";
            
            if (data && typeof data === 'object') {
              // Try different possible response formats
              if (data.response) {
                botResponse = data.response;
              } else if (data.message) {
                botResponse = data.message;
              } else if (data.text) {
                botResponse = data.text;
              } else if (data.content) {
                botResponse = data.content;
              } else if (typeof data === 'string') {
                botResponse = data;
              } else if (data.error) {
                botResponse = `Error: ${data.error}`;
              }
            } else if (typeof data === 'string') {
              botResponse = data;
            }
            
            console.log('Processed bot response:', botResponse);
            
            const botReply = {
              id: `bot-${Date.now()}`,
              type: 'bot',
              content: botResponse,
              displayedContent: botResponse,
              isTyping: false
            };
            setMessages(prev => [...prev, botReply]);
            // Ensure input is ready before attempting to speak
            setTimeout(() => {
              // Only speak if not muted and input is not being used
              if (!mutedMessages.has(botReply.id)) {
                speak(botReply.content, botReply.id, messageOutputLanguages[botReply.id] || selectedLanguage);
              }
            }, 100);
          })
          .catch(err => {
            console.error("Backend error:", err);
            console.error("Error details:", {
              message: err.message,
              stack: err.stack,
              sessionId: sessionId
            });
            
            let errorMessage = "Oops! Something went wrong. Please try again later.";
            
            if (err.message.includes('Failed to fetch')) {
              errorMessage = "Network error. Please check your internet connection.";
            } else if (err.message.includes('HTTP error')) {
              errorMessage = "Server error. Please try again in a moment.";
            } else if (err.message.includes('JSON')) {
              errorMessage = "Invalid response from server. Please try again.";
            }
            
            setMessages(prev => [...prev, {
              id: `bot-error-${Date.now()}`,
              type: 'bot',
              content: errorMessage,
              displayedContent: errorMessage,
              isTyping: false
            }]);
          })
          .finally(() => {
            setIsTyping(false);
            // Switch back to text mode after voice input is complete
            console.log('Switching back to text mode after voice input');
            setInputMode('text');
            // Ensure input field gets focus after switching modes
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                console.log('Focused input field after voice input');
              }
            }, 100);
          });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userMessage, isListening, inputMode, sessionId, speak, mutedMessages, selectedLanguage]);

  useEffect(() => {
    if (currentTypingIndex >= 0 && messages[currentTypingIndex]?.isTyping) {
      const message = messages[currentTypingIndex];
      const fullText = message.content;
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex <= fullText.length) {
          const nextIndex = Math.min(currentIndex + 3, fullText.length);
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
      return () => clearTimeout(typingTimeoutRef.current);
    }
  }, [currentTypingIndex, messages]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  // Handle clicking outside language selector
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageSelector && !event.target.closest('.language-selector-container')) {
        setShowLanguageSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageSelector]);

  // Handle language change
  const handleLanguageChange = useCallback((langKey) => {
    const langData = supportedLanguages[langKey];
    if (langData) {
      setSelectedLanguage(langKey);
      setLanguage(langData.code);
      
      // Update speech recognition language if active
      if (recognitionRef.current) {
        recognitionRef.current.lang = langData.code;
      }
      
      // Stop current speech and speak confirmation in new language
      stopSpeaking();
      
      const confirmations = {
        english: "Language changed to English",
        hindi: "भाषा हिंदी में बदल गई है",
        tamil: "மொழி தமிழுக்கு மாற்றப்பட்டது",
        telugu: "భాష తెలుగుకు మార్చబడింది",
        kannada: "ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ",
        bengali: "ভাষা বাংলায় পরিবর্তন করা হয়েছে"
      };
      
      const confirmation = confirmations[langKey] || confirmations.english;
      
      // Add language change message
      const langChangeMessage = {
        id: `lang-change-${Date.now()}`,
        type: 'bot',
        content: confirmation,
        displayedContent: confirmation,
        isTyping: false
      };
      
      setMessages(prev => [...prev, langChangeMessage]);
      
      // Speak the confirmation
      setTimeout(() => {
        speak(confirmation, langChangeMessage.id, messageOutputLanguages[langChangeMessage.id] || selectedLanguage);
      }, 100);
      
      setShowLanguageSelector(false);
    }
  }, [stopSpeaking, speak, selectedLanguage, messageOutputLanguages]);

  // Handler for changing output language for a message
  const handleMessageOutputLanguageChange = useCallback((messageId, langKey) => {
    setMessageOutputLanguages(prev => ({ ...prev, [messageId]: langKey }));
    // Optionally, speak immediately in new language
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
      speak(message.content, messageId, langKey);
    }
  }, [messages, speak]);

  return (
    isVisible && (
      <div className="chatbot-container">
        <div className="bot-header">
          <div className="main-bot-avatar-container">
            <img src="/nisaahalf.png" alt="Bot" className="main-bot-avatar" onClick={toggleChatBot} title="Click to close" />
          </div>
        </div>

        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index}>
              {msg.type === 'bot' ? (
                <div className="bot-message-container">
                  <div className="bot-avatar"><img src="/nisaa.png" alt="Bot" /></div>
                  <div className="bot-content">
                    <div className="message bot" style={{ position: 'relative' }}>
                      <BotResponse content={msg.displayedContent} />
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8 }}>
                        <button 
                          className={`speak-button ${mutedMessages.has(msg.id) ? 'muted' : ''}`} 
                          onClick={(e) => handleSpeakerClick(msg.id, e)} 
                          title={
                            mutedMessages.has(msg.id) ? 
                              (selectedLanguage === 'hindi' ? 'अनम्यूट करें और यह संदेश सुनें' :
                               selectedLanguage === 'tamil' ? 'அன்மியூட் செய்து இந்த செய்தியைக் கேள்விப்படுத்துங்கள்' :
                               selectedLanguage === 'telugu' ? 'అన్మ్యూట్ చేసి ఈ సందేశాన్ని వినండి' :
                               selectedLanguage === 'kannada' ? 'ಅನ್‌ಮ್ಯೂಟ್ ಮಾಡಿ ಮತ್ತು ಈ ಸಂದೇಶವನ್ನು ಕೇಳಿ' :
                               selectedLanguage === 'bengali' ? 'আনমিউট করুন এবং এই বার্তাটি শুনুন' :
                               "Unmute and speak this message") 
                              : 
                              (selectedLanguage === 'hindi' ? 'इस संदेश को सुनने के लिए क्लिक करें' :
                               selectedLanguage === 'tamil' ? 'இந்த செய்தியைக் கேட்க கிளிக் செய்யவும்' :
                               selectedLanguage === 'telugu' ? 'ఈ సందేశాన్ని వినడానికి క్లిక్ చేయండి' :
                               selectedLanguage === 'kannada' ? 'ಈ ಸಂದೇಶವನ್ನು ಕೇಳಲು ಕ್ಲಿಕ್ ಮಾಡಿ' :
                               selectedLanguage === 'bengali' ? 'এই বার্তাটি শুনতে ক্লিক করুন' :
                               "Click to hear this message")
                          }
                        >
                          {mutedMessages.has(msg.id) ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                          )}
                        </button>
                      </span>
                      <div className="bot-lang-dropdown-container" style={{ position: 'absolute', bottom: 8, right: 8 }}>
                        <button
                          className="bot-lang-btn"
                          onClick={e => {
                            e.stopPropagation();
                            setMessageOutputLanguages(prev => ({ ...prev, [`show_${msg.id}`]: !prev[`show_${msg.id}`] }));
                          }}
                          title="Select output language for this message"
                        >
                          {(messageOutputLanguages[msg.id] || selectedLanguage).toUpperCase().slice(0,2)}
                        </button>
                        {messageOutputLanguages[`show_${msg.id}`] && (
                          <div className="bot-lang-dropdown">
                            {Object.entries(supportedLanguages).map(([key, lang]) => (
                              <div
                                key={key}
                                className={`bot-lang-option${(messageOutputLanguages[msg.id] || selectedLanguage) === key ? ' selected' : ''}`}
                                onClick={e => {
                                  e.stopPropagation();
                                  setMessageOutputLanguages(prev => ({ ...prev, [msg.id]: key, [`show_${msg.id}`]: false }));
                                  const message = messages.find(m => m.id === msg.id);
                                  if (message) speak(message.content, msg.id, key);
                                }}
                              >
                                {lang.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                <div className="bot-avatar"><img src="/nisaa.png" alt="Bot" /></div>
                <div className="typing-indicator"><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container" onClick={() => {
          if (inputMode === 'text' && inputRef.current) {
            inputRef.current.focus();
          }
        }}>
          {inputMode === 'text' ? (
          <input
              ref={inputRef}
            type="text"
            className="message-input"
            value={userMessage}
              onChange={(e) => {
                console.log('Input onChange:', e.target.value);
                setUserMessage(e.target.value);
              }}
              onFocus={() => console.log('Input focused')}
              onBlur={() => console.log('Input blurred')}
              onClick={() => {
                console.log('Input clicked, ensuring focus');
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            placeholder={
              selectedLanguage === 'hindi' ? 'अपना संदेश लिखें...' :
              selectedLanguage === 'tamil' ? 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...' :
              selectedLanguage === 'telugu' ? 'మీ సందేశాన్ని టైప్ చేయండి...' :
              selectedLanguage === 'kannada' ? 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...' :
              selectedLanguage === 'bengali' ? 'আপনার বার্তা টাইপ করুন...' :
              'Type your message...'
            }
              onKeyPress={(e) => {
                console.log('Key pressed:', e.key);
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  console.log('Enter pressed, calling handleSendMessage');
                  handleSendMessage();
                }
              }}
              disabled={false} // Always enable input
              autoFocus={inputMode === 'text'} // Auto focus when in text mode
            />
          ) : (
            <div className="voice-input-display">
              <span className="voice-status">
                {isListening ? (
                  selectedLanguage === 'hindi' ? 'सुन रहा हूँ...' :
                  selectedLanguage === 'tamil' ? 'கேட்கிறேன்...' :
                  selectedLanguage === 'telugu' ? 'వింటున్నాను...' :
                  selectedLanguage === 'kannada' ? 'ಕೇಳುತ್ತಿದ್ದೇನೆ...' :
                  selectedLanguage === 'bengali' ? 'শুনছি...' :
                  'Listening...'
                ) : ''}
              </span>
              {userMessage && <span className="voice-transcript">"{userMessage}"</span>}
            </div>
          )}
          
          <button             className={`send-button ${userMessage.trim() ? 'ready' : ''}`} 
            onClick={(e) => {
              console.log('Send button clicked!', { userMessage, sessionId, inputMode });
              e.stopPropagation(); // Prevent triggering the container click
              e.preventDefault();
              handleSendMessage();
            }} 
            disabled={!userMessage.trim()}
            title={
              selectedLanguage === 'hindi' ? 'संदेश भेजें' :
              selectedLanguage === 'tamil' ? 'செய்தியை அனுப்பு' :
              selectedLanguage === 'telugu' ? 'సందేశాన్ని పంపండి' :
              selectedLanguage === 'kannada' ? 'ಸಂದೇಶ ಕಳುಹಿಸಿ' :
              selectedLanguage === 'bengali' ? 'বার্তা পাঠান' :
              "Send message"
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
          
          <button 
            className={`voice-button ${isListening ? 'listening' : ''} ${inputMode === 'voice' ? 'active' : ''} ${isSpeaking ? 'speaking' : ''}`} 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the container click
              e.preventDefault();
              handleVoiceButtonClick();
            }} 
            title={
              isSpeaking 
                ? (selectedLanguage === 'hindi' ? 'चैटबॉट बोलना बंद करें' :
                   selectedLanguage === 'tamil' ? 'சாட்போட் பேச்சை நிறுத்து' :
                   selectedLanguage === 'telugu' ? 'చాట్‌బాట్ మాట్లాడటం ఆపండి' :
                   selectedLanguage === 'kannada' ? 'ಚಾಟ್‌ಬಾಟ್ ಮಾತನಾಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ' :
                   selectedLanguage === 'bengali' ? 'চ্যাটবট কথা বলা বন্ধ করুন' :
                   "Stop chatbot speech")
                : inputMode === 'voice' 
                  ? (isListening ? 
                      (selectedLanguage === 'hindi' ? 'सुनना बंद करें' :
                       selectedLanguage === 'tamil' ? 'கேட்பதை நிறுத்து' :
                       selectedLanguage === 'telugu' ? 'వింటున్నది ఆపండి' :
                       selectedLanguage === 'kannada' ? 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ' :
                       selectedLanguage === 'bengali' ? 'শোনা বন্ধ করুন' :
                       "Stop listening") 
                      : 
                      (selectedLanguage === 'hindi' ? 'सुनना शुरू करें' :
                       selectedLanguage === 'tamil' ? 'கேட்பதைத் தொடங்கு' :
                       selectedLanguage === 'telugu' ? 'వింటున్నది ప్రారంభించండి' :
                       selectedLanguage === 'kannada' ? 'ಕೇಳುವುದನ್ನು ಪ್ರಾರಂಭಿಸಿ' :
                       selectedLanguage === 'bengali' ? 'শোনা শুরু করুন' :
                       "Start listening"))
                  : (selectedLanguage === 'hindi' ? 'आवाज मोड में बदलें' :
                     selectedLanguage === 'tamil' ? 'குரல் பயன்முறைக்கு மாற்று' :
                     selectedLanguage === 'telugu' ? 'వాయిస్ మోడ్‌కి మార్చండి' :
                     selectedLanguage === 'kannada' ? 'ಧ್ವನಿ ಮೋಡ್‌ಗೆ ಬದಲಾಯಿಸಿ' :
                     selectedLanguage === 'bengali' ? 'ভয়েস মোডে পরিবর্তন করুন' :
                     "Switch to voice mode")
            }
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

