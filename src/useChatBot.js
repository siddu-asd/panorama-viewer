import { useState, useEffect, useRef, useCallback } from 'react';
import { speak, stopSpeaking, initializeSpeechRecognition, testAPIConnection, supportedLanguages } from './chatUtils';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const API_BASE = 'https://m-touch-labs.onrender.com/';

export const useChatBot = (isVisible) => {
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [micPermission, setMicPermission] = useState(null);
  const [language, setLanguage] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [currentTypingIndex, setCurrentTypingIndex] = useState(-1);
  const [voices, setVoices] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mutedMessages, setMutedMessages] = useState(new Set());
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const currentUtteranceRef = useRef(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        console.log('Voices loaded:', availableVoices.map(v => ({ name: v.name, lang: v.lang })));
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

  // Generate session ID
  useEffect(() => {
    if (!isVisible) return;
    console.log('Generating session ID...');
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
          const fallbackId = `fallback-${Date.now()}`;
          setSessionId(fallbackId);
        }
      })
      .catch((err) => {
        console.error('Failed to generate session ID:', err);
        const fallbackId = `fallback-${Date.now()}`;
        setSessionId(fallbackId);
      });
  }, [isVisible]);

  // Welcome message
  useEffect(() => {
    if (isVisible && messages.length === 0 && voices.length > 0) {
      const welcome = {
        id: 'welcome',
        type: 'bot',
        content: "Welcome! I'm Nisaa, your assistant from Raising 100X. Say or type 'change language to [language]' to switch languages.",
        displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X. Say or type 'change language to [language]' to switch languages.",
        isTyping: false,
      };
      setMessages([welcome]);
      setTimeout(() => speak(welcome.content, welcome.id, language, voices, mutedMessages, setIsSpeaking, setMessages), 100);
    }
  }, [isVisible, messages.length, language, voices, mutedMessages]);

  // Speak last bot message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.type === 'bot' && !last.isTyping && voices.length > 0) {
      setTimeout(() => speak(last.content, last.id, language, voices, mutedMessages, setIsSpeaking, setMessages), 100);
    }
  }, [messages, language, voices, mutedMessages]);

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
    if (isVisible && inputMode === 'text') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isVisible, inputMode]);

  useEffect(() => {
    if (isVisible && inputMode === 'text' && !isTyping) {
      setTimeout(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }, 200);
    }
  }, [isVisible, inputMode, isTyping, messages.length]);

  useEffect(() => {
    if (isVisible && inputMode === 'text' && !isListening) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 300);
    }
  }, [isVisible, inputMode, isListening]);

  // Reinitialize speech recognition when language changes
  useEffect(() => {
    if (inputMode === 'voice' && recognitionRef.current) {
      recognitionRef.current = initializeSpeechRecognition(language, setIsListening, setUserMessage);
      console.log(`Speech recognition reinitialized for language: ${language}`);
    }
  }, [language, inputMode]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synth) synth.cancel();
      setIsSpeaking(false);
    };
  }, []);

  const detectLanguageChange = useCallback((message) => {
    const lowerMessage = message.toLowerCase().trim();
    const langKey = Object.keys(supportedLanguages).find((key) =>
      supportedLanguages[key].keywords.some((kw) => lowerMessage.includes(kw.toLowerCase()))
    );
    return langKey ? supportedLanguages[langKey].code : null;
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!userMessage.trim() || !sessionId) return;
    if (isSpeaking) stopSpeaking(setIsSpeaking);

    const messageToSend = userMessage.trim();
    setUserMessage('');
    setTimeout(() => {
      if (inputRef.current && inputMode === 'text') inputRef.current.focus();
    }, 10);

    // Check for language change
    const newLanguage = detectLanguageChange(messageToSend);
    if (newLanguage && voices.length > 0) {
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
      setTimeout(() => {
        if (!mutedMessages.has(botReply.id)) {
          speak(botReply.content, botReply.id, newLanguage, voices, mutedMessages, setIsSpeaking, setMessages);
        }
      }, 100);
      return;
    }

    const newUserMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageToSend,
    };
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
        let botResponse =
          data.response ||
          data.message ||
          data.text ||
          data.content ||
          (typeof data === 'string' ? data : data.error ? `Error: ${data.error}` : "Sorry, I didn't understand that.");
        const botReply = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: botResponse,
          displayedContent: botResponse,
          isTyping: false,
        };
        setMessages((prev) => [...prev, botReply]);
        setTimeout(() => {
          if (!mutedMessages.has(botReply.id) && voices.length > 0) {
            speak(botReply.content, botReply.id, language, voices, mutedMessages, setIsSpeaking, setMessages);
          }
        }, 100);
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
        setTimeout(() => {
          if (inputRef.current && inputMode === 'text') inputRef.current.focus();
        }, 50);
      });
  }, [userMessage, sessionId, isSpeaking, inputMode, mutedMessages, language, voices, detectLanguageChange]);

  const handleVoiceButtonClick = useCallback(() => {
    if (isSpeaking) stopSpeaking(setIsSpeaking);
    if (inputMode === 'text') {
      setInputMode('voice');
      if (!recognitionRef.current) recognitionRef.current = initializeSpeechRecognition(language, setIsListening, setUserMessage);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setInputMode('text');
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 100);
      }
    } else {
      if (isListening) {
        recognitionRef.current?.stop();
        setTimeout(() => {
          setInputMode('text');
          if (inputRef.current) inputRef.current.focus();
        }, 200);
      } else {
        if (!recognitionRef.current) recognitionRef.current = initializeSpeechRecognition(language, setIsListening, setUserMessage);
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setInputMode('text');
          setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
          }, 100);
        }
      }
    }
  }, [isSpeaking, inputMode, isListening, language]);

  const handleSpeakerClick = useCallback(
    (messageId, e) => {
      e.preventDefault();
      e.stopPropagation();
      setMutedMessages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(messageId)) {
          newSet.delete(messageId);
        } else {
          newSet.add(messageId);
          if (isSpeaking) stopSpeaking(setIsSpeaking);
        }
        return newSet;
      });
      setTimeout(() => {
        if (inputRef.current && inputMode === 'text') inputRef.current.focus();
      }, 50);
    },
    [isSpeaking, inputMode]
  );

  // Auto-send voice message
  useEffect(() => {
    if (inputMode === 'voice' && userMessage.trim() && !isListening) {
      const timer = setTimeout(() => {
        const messageToSend = userMessage.trim();
        setUserMessage('');
        const newLanguage = detectLanguageChange(messageToSend);
        if (newLanguage && voices.length > 0) {
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
          setTimeout(() => {
            if (!mutedMessages.has(botReply.id)) {
              speak(botReply.content, botReply.id, newLanguage, voices, mutedMessages, setIsSpeaking, setMessages);
            }
          }, 100);
          setInputMode('text');
          setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
          }, 100);
          return;
        }

        const newUserMessage = {
          id: `user-${Date.now()}`,
          type: 'user',
          content: messageToSend,
        };
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
            let botResponse =
              data.response ||
              data.message ||
              data.text ||
              data.content ||
              (typeof data === 'string' ? data : data.error ? `Error: ${data.error}` : "Sorry, I didn't understand that.");
            const botReply = {
              id: `bot-${Date.now()}`,
              type: 'bot',
              content: botResponse,
              displayedContent: botResponse,
              isTyping: false,
            };
            setMessages((prev) => [...prev, botReply]);
            setTimeout(() => {
              if (!mutedMessages.has(botReply.id) && voices.length > 0) {
                speak(botReply.content, botReply.id, language, voices, mutedMessages, setIsSpeaking, setMessages);
              }
            }, 100);
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
            setInputMode('text');
            setTimeout(() => {
              if (inputRef.current) inputRef.current.focus();
            }, 100);
          });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [inputMode, userMessage, isListening, sessionId, language, voices, mutedMessages, detectLanguageChange]);

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
    voices,
    setVoices,
    isTyping,
    setIsTyping,
    sessionId,
    setSessionId,
    inputMode,
    setInputMode,
    isSpeaking,
    setIsSpeaking,
    mutedMessages,
    setMutedMessages,
    recognitionRef,
    messagesEndRef,
    typingTimeoutRef,
    inputRef,
    currentUtteranceRef,
    handleSendMessage,
    handleVoiceButtonClick,
    handleSpeakerClick,
  };
};