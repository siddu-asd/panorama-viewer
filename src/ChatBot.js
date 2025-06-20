import React, { useState, useEffect, useRef, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const supportedLanguages = {
  english: { code: 'en-US', keywords: ['english', 'speak in english'] },
  hindi: { code: 'hi-IN', keywords: ['hindi', 'speak in hindi'] },
  spanish: { code: 'es-ES', keywords: ['spanish', 'speak in spanish'] },
  french: { code: 'fr-FR', keywords: ['french', 'speak in french'] },
};

const ChatBot = ({ isVisible, toggleChatBot }) => {
  const [userMessage, setUserMessage] = useState('');
  const [botMessage, setBotMessage] = useState('');
  const [micPermission, setMicPermission] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const loadVoices = () => synth.getVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  const speak = useCallback(
    (text) => {
      if (!synth) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;

      const voices = synth.getVoices();
      const preferredFemaleVoices = [
        'google uk english female',
        'google us english female',
        'samantha',
        'victoria',
        'zira',
      ];
      const femaleVoice = voices.find((v) =>
        v.lang === language && preferredFemaleVoices.some((name) => v.name.toLowerCase().includes(name))
      );
      const fallbackVoice = voices.find((v) => v.lang === language);
      utterance.voice = femaleVoice || fallbackVoice;

      synth.speak(utterance);
    },
    [language]
  );

  const stopSpeaking = () => synth.cancel();

  const checkMicPermission = async () => {
    if (!navigator.permissions) {
      setMicPermission('unknown');
      return;
    }
    try {
      const status = await navigator.permissions.query({ name: 'microphone' });
      setMicPermission(status.state);
      status.onchange = () => setMicPermission(status.state);
    } catch (err) {
      setMicPermission('unknown');
    }
  };

  useEffect(() => {
    checkMicPermission();
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (micPermission === 'denied') {
      alert('Microphone access denied.');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setUserMessage(transcript);

        const matchedLang = Object.entries(supportedLanguages).find(([_, langData]) =>
          langData.keywords.some((keyword) => transcript.includes(keyword))
        );

        if (matchedLang) {
          const newLangCode = matchedLang[1].code;
          setLanguage(newLangCode);
          recognition.lang = newLangCode;
          speak(`Language changed to ${matchedLang[0]}`);
          return;
        }

        const response = language.startsWith('hi')
          ? 'नमस्ते! मैं निसा हूँ। कैसे मदद कर सकती हूँ?'
          : language.startsWith('es')
          ? '¡Hola! Soy Nisaa. ¿Cómo puedo ayudarte?'
          : language.startsWith('fr')
          ? 'Bonjour! Je suis Nisaa. Comment puis-je vous aider?'
          : 'Hello! This is Nisaa. How can I assist you today?';

        setBotMessage(response);
        speak(response);
      };

      recognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          alert('Microphone permission denied.');
          toggleChatBot();
        }
      };

      recognition.onend = () => {
        if (isVisible) {
          try {
            recognition.start();
            recognition.isStarted = true;
          } catch (e) {
            console.warn('Recognition restart blocked:', e.message);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    const recognition = recognitionRef.current;
    recognition.lang = language;

    if (recognition.isStarted) return;

    try {
      recognition.start();
      recognition.isStarted = true;
    } catch (err) {
      console.error('SpeechRecognition failed to start:', err);
    }
  }, [micPermission, language, speak, isVisible, toggleChatBot]);

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.stop();
      recognition.isStarted = false;
    }
  };

  useEffect(() => {
    if (isVisible) {
      if (['granted', 'prompt', 'unknown'].includes(micPermission)) {
        const greeting = language.startsWith('hi')
          ? 'नमस्ते, मैं निसा हूँ।'
          : language.startsWith('es')
          ? '¡Hola! Soy Nisaa.'
          : language.startsWith('fr')
          ? 'Bonjour! Je suis Nisaa.'
          : "Hi, I'm Nisaa. Nice to meet you!";
        setBotMessage(greeting);
        speak(greeting);
      } else {
        alert('Microphone permission denied.');
        toggleChatBot();
      }
    } else {
      stopListening();
      stopSpeaking();
      setUserMessage('');
      setBotMessage('');
      setIsListening(false);
    }
  }, [isVisible, micPermission, language, speak, toggleChatBot]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      startListening();
      setIsListening(true);
    }
  };

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;

    const lowerMsg = userMessage.toLowerCase();

    const simulatedResponse = lowerMsg.includes('what is') || lowerMsg.includes('raising 100x')
      ? 'Raising 100X is a growth-focused marketing company helping brands scale rapidly using data-driven strategies.'
      : lowerMsg.includes('employees') || lowerMsg.includes('staff') || lowerMsg.includes('team')
      ? 'We have a talented team of over 20 professionals across strategy, content, performance marketing, and design.'
      : lowerMsg.includes('ceo') || lowerMsg.includes('founder') || lowerMsg.includes('leader')
      ? 'Our CEO is Mr. Ibrahim Abdulla, a marketing visionary with years of experience scaling brands.'
      : lowerMsg.includes('services') || lowerMsg.includes('offerings') || lowerMsg.includes('solutions')
      ? 'We offer branding, performance marketing, SEO, social media strategy, content creation, and marketing automation services.'
      : lowerMsg.includes('contact') || lowerMsg.includes('reach') || lowerMsg.includes('email')
      ? 'You can contact us at contact@raising100x.com or fill out the form on our website.'
      : lowerMsg.includes('location') || lowerMsg.includes('based') || lowerMsg.includes('office')
      ? 'We are based in India, with a digital-first team supporting clients worldwide.'
      : lowerMsg.includes('meeting') || lowerMsg.includes('appointment') || lowerMsg.includes('book')
      ? "You can book a consultation with us here: <a href='https://calendly.com' target='_blank'>Book a Call</a>."
      : lowerMsg.includes('clients') || lowerMsg.includes('portfolio') || lowerMsg.includes('worked with')
      ? 'We've worked with startups and enterprises across tech, fashion, and education. Want to see case studies?'
      : lowerMsg.includes('why') || lowerMsg.includes('different') || lowerMsg.includes('unique')
      ? 'We combine data science with storytelling to deliver rapid growth marketing solutions.'
      : lowerMsg.includes('hiring') || lowerMsg.includes('careers') || lowerMsg.includes('jobs')
      ? "Yes! We're hiring. Send your CV to careers@raising100x.com or visit our Careers page."
      : "I'm Nisaa, your assistant from Raising 100X. Ask me anything about our services, team, or how to get started!";

    setBotMessage(simulatedResponse);
    speak(simulatedResponse);
    setUserMessage('');
  };

  return (
    isVisible && (
      <>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap');
            .nisaa-bot-img {
              width: 180px;
              margin: 0 auto;
              border-radius: 50%;
              box-shadow: 0 0 35px rgba(170, 110, 255, 0.4);
              margin-bottom: 28px;
            }
            .chat-bubble-user {
              align-self: flex-end;
              background: linear-gradient(135deg, #e0e7ff, #d2c7ff);
              border-radius: 18px 18px 4px 18px;
              padding: 12px 16px;
              max-width: 75%;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .chat-bubble-bot {
              align-self: flex-start;
              background: white;
              border-radius: 18px 18px 18px 4px;
              padding: 12px 16px;
              max-width: 85%;
              margin-bottom: 10px;
              font-size: 14px;
              display: flex;
              gap: 10px;
            }
            .bot-avatar {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #e7d6ff;
              padding: 2px;
            }
            .input-area {
              display: flex;
              align-items: center;
              background: white;
              border-radius: 20px;
              padding: 10px 16px;
              box-shadow: 0 4px 12px rgba(120, 0, 255, 0.1);
              margin-top: 12px;
            }
            .input-area input {
              flex: 1;
              border: none;
              outline: none;
              font-size: 14px;
              font-family: 'Montserrat';
              color: #333;
              background: transparent;
            }
            .input-area .mic-btn {
              width: 28px;
              height: 28px;
              background: #f0e4ff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-left: 10px;
              box-shadow: 0 2px 6px rgba(120, 0, 255, 0.1);
              cursor: pointer;
            }
            @media (max-width: 768px) {
              div[style*='position: fixed'] {
                width: 98vw !important;
                right: 1vw !important;
                left: 1vw !important;
                bottom: 10px !important;
                padding: 18px !important;
                border-radius: 22px !important;
              }
              .nisaa-bot-img {
                width: 150px;
                margin-bottom: 22px;
              }
              .input-area {
                padding: 8px 10px;
              }
              .chat-bubble-user, .chat-bubble-bot {
                font-size: 13px;
                padding: 10px 12px;
              }
            }
            @media (max-width: 480px) {
              div[style*='position: fixed'] {
                width: 100vw !important;
                right: 0 !important;
                left: 0 !important;
                bottom: 0 !important;
                border-radius: 0 !important;
                min-height: 70vh !important;
                max-height: 100vh !important;
                height: 70vh !important;
                padding: 6vw 2vw !important;
              }
              .nisaa-bot-img {
                width: 120px;
                margin-bottom: 16px;
              }
              .input-area {
                padding: 6px 6px;
              }
              .chat-bubble-user, .chat-bubble-bot {
                font-size: 12px;
                padding: 8px 8px;
              }
            }
          `}
        </style>
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '30px', // Changed from left to right
            width: '370px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #f9f7ff 0%, #ece7ff 100%)',
            boxShadow: '0 12px 28px rgba(120, 0, 255, 0.15)',
            zIndex: 1000,
            fontFamily: "'Montserrat', sans-serif",
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
          }}
        >
          <img src="/nisaa.png" alt="Bot" className="nisaa-bot-img" />
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {userMessage && <div className="chat-bubble-user">{userMessage}</div>}
            {botMessage && (
              <div className="chat-bubble-bot">
                <img src="/nisaa.png" className="bot-avatar" alt="bot avatar" style={{ width: '40px', height: '40px' }} />
                <div>
                  {botMessage.includes('<ul') ? (
                    <div dangerouslySetInnerHTML={{ __html: botMessage }} />
                  ) : (
                    <div>{botMessage}</div>
                  )}
                </div>
              </div>
            )}
            <div className="input-area" style={{ display: 'flex', alignItems: 'center', marginTop: '12px', gap: '8px' }}>
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ask me something..."
                style={{ flexGrow: 1, padding: '10px', borderRadius: '16px', border: '1px solid #ccc' }}
              />
              <button
                onClick={handleSendMessage}
                style={{ padding: '8px 16px', borderRadius: '16px', backgroundColor: '#aa6eff', color: 'white', border: 'none' }}
              >
                Send
              </button>
              <div
                className="mic-btn"
                onClick={toggleListening}
                style={{
                  backgroundColor: isListening ? '#aa6eff' : '#f0e4ff',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                <img src="/mic.png" alt="mic" style={{ width: '32px' }} />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  );
};

export default ChatBot;