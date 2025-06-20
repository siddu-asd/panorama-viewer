import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/ChatBot2.css';
import BotResponse from './BotResponse'; // adjust the path if needed

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
  const [sessionId, setSessionId] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'voice'
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if chatbot is currently speaking
  const [mutedMessages, setMutedMessages] = useState(new Set()); // Track which messages are muted
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

  const speak = useCallback((text, messageId = null) => {
    if (!synth) {
      console.log('Speech synthesis not available');
      return;
    }
    
    // Don't speak if this specific message is muted
    if (messageId && mutedMessages.has(messageId)) {
      console.log('Message is muted, not speaking:', messageId);
      return;
    }
    
    console.log('Speaking message:', text, 'Message ID:', messageId);
    
    // Stop any current speech
    synth.cancel();
    setIsSpeaking(false);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    const allVoices = voices.length > 0 ? voices : synth.getVoices();
    const langPrefix = language.split('-')[0].toLowerCase();
    const langVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
    const preferredKeywords = ['female', 'woman', 'google'];
    const femaleVoice = langVoices.find(v => preferredKeywords.some(k => v.name.toLowerCase().includes(k)));
    const fallbackVoice = langVoices[0] || allVoices[0];
    utterance.voice = femaleVoice || fallbackVoice;

    utterance.rate = 0.9;
    utterance.pitch = 1.15;
    utterance.volume = 1;
    utterance.text = text.replace(/([.!?])\s*/g, '$1... ');
    
    // Track speech events
    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
      currentUtteranceRef.current = utterance;
    };
    
    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    try {
    synth.speak(utterance);
      console.log('Speech synthesis initiated');
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      setIsSpeaking(false);
    }
  }, [language, voices, mutedMessages]);

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
      speak(message.content, messageId);
    } else {
      console.log('Cannot speak message:', messageId, 'Muted:', mutedMessages.has(messageId));
    }
  }, [messages, mutedMessages, speak]);

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
      const welcome = {
        id: 'welcome',
        type: 'bot',
        content: "Welcome! I'm Nisaa, your assistant from Raising 100X.",
        displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X.",
        isTyping: false
      };
      setMessages([welcome]);
      setTimeout(() => speak(welcome.content, welcome.id), 100);
    }
  }, [isVisible, messages.length, speak]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.type === 'bot' && !last.isTyping) {
      setTimeout(() => speak(last.content, last.id), 100);
    }
  }, [messages, speak]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageToSend, session_id: sessionId })
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
            speak(botReply.content, botReply.id);
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
  }, [userMessage, sessionId, speak, mutedMessages, inputMode, isSpeaking, stopSpeaking]);

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
      const transcript = event.results[0][0].transcript;
      setUserMessage(transcript);
      console.log('Transcript:', transcript);
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
        
        const newUserMessage = { 
          id: `user-${Date.now()}`,
          type: 'user', 
          content: messageToSend
        };
        setMessages(prev => [...prev, newUserMessage]);
        setIsTyping(true);

        fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageToSend, session_id: sessionId })
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
                speak(botReply.content, botReply.id);
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
  }, [userMessage, isListening, inputMode, sessionId, speak, mutedMessages]);

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
                    <div className="message bot">
                    <BotResponse content={msg.displayedContent} />
                      <button 
                        className={`speak-button ${mutedMessages.has(msg.id) ? 'muted' : ''}`} 
                        onClick={(e) => handleSpeakerClick(msg.id, e)} 
                        title={mutedMessages.has(msg.id) ? "Unmute and speak this message" : "Click to hear this message"}
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
            placeholder="Type your message..."
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
                {isListening ? 'Listening...' : ''}
              </span>
              {userMessage && <span className="voice-transcript">"{userMessage}"</span>}
            </div>
          )}
          
          <button 
            className={`send-button ${userMessage.trim() ? 'ready' : ''}`} 
            onClick={(e) => {
              console.log('Send button clicked!', { userMessage, sessionId, inputMode });
              e.stopPropagation(); // Prevent triggering the container click
              e.preventDefault();
              handleSendMessage();
            }} 
            disabled={!userMessage.trim()}
            title="Send message"
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
                ? "Stop chatbot speech" 
                : inputMode === 'voice' 
                  ? (isListening ? "Stop listening" : "Start listening") 
                  : "Switch to voice mode"
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
