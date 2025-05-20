import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import 'font-awesome/css/font-awesome.min.css';
import { color } from 'three/tsl';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;



const supportedLanguages = {
  english: { code: 'en-US', keywords: ['english', 'speak in english'] },
  hindi: { code: 'hi-IN', keywords: ['hindi', 'speak in hindi'] },
  spanish: { code: 'es-ES', keywords: ['spanish', 'speak in spanish'] },
  french: { code: 'fr-FR', keywords: ['french', 'speak in french'] },
};

const scenes = {
 ENTRY: {
    panorama: '/office-15.jpg',
    markers: [
      { id: 'TO-ROOM1', image: 'office-10.jpg', tooltip: 'Enter into the office', position: { yaw: -3.0, pitch: -0.15 }, target: 'ROOM1' },
      { id: 'TO-STUDIO-OUTSIDE', image: 'office-6.jpg', tooltip: 'Go to Studio', position: { yaw: -2.0, pitch: -0.1 }, target: 'STUDIO-OUTSIDE' },
      { id: 'TO-NEW-OFFICE', image: 'office-11.jpg', tooltip: 'Enter New Office', position: { yaw: 1.5, pitch: 0.2 }, target: 'NEW-OFFICE' },
    ],
  },
  ROOM1: {
    panorama: '/office-10.jpg',
    markers: [
      { id: 'TO-ADMIN-BLOCK', image: 'office-14.jpg', tooltip: 'See Workspace', position: { yaw: 2.5, pitch: -0.1 }, target: 'ADMIN-BLOCK' },
      { id: 'ROOM1-BACK', image: 'office-15.jpg', tooltip: 'Back', position: { yaw: -0.6, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'ADMIN-BLOCK': {
    panorama: '/office-14.jpg',
    markers: [
      { id: 'TO-MEETING-ROOM', image: 'office-7.jpg', tooltip: 'Meeting Room', position: { yaw: -0.7, pitch: -0.1 }, target: 'MEETING-ROOM' },
      { id: 'TO-WORKSPACE-FROM-ADMIN', image: 'office-7.jpg', tooltip: 'Work-space', position: { yaw: -0.4, pitch: 0.1 }, target: 'WORKSPACE' },
      { id: 'ADMIN-BLOCK-BACK', image: 'office-10.jpg', tooltip: 'Back', position: { yaw: 2.6, pitch: -0.1 }, target: 'ROOM1' },
    ],
  },
  'MEETING-ROOM': {
    panorama: '/office-7.jpg',
    markers: [
      { id: 'MEETING-BACK', image: 'office-14.jpg', tooltip: 'Back to Admin Block', position: { yaw: -0.95, pitch: -0.25 }, target: 'ADMIN-BLOCK' },
    ],
  },
  'WORKSPACE': {
    panorama: '/office-2.jpg',
    markers: [
      { id: 'WORKSPACE-BACK', image: 'office-14.jpg', tooltip: 'Back to Admin Block', position: { yaw: -2.5, pitch: -0.1 }, target: 'ADMIN-BLOCK' },
    ],
  },
  'NEW-OFFICE': {
    panorama: '/office-11.jpg',
    markers: [
      { id: 'TO-NEW-OFFICE-INSIDE', image: 'office-12.jpg', tooltip: 'See New Office', position: { yaw: -0.2, pitch: 0.1 }, target: 'NEW-OFFICE-INSIDE' },
      { id: 'NEW-OFFICE-BACK', image: 'office-15.jpg', tooltip: 'Back', position: { yaw: 1.5, pitch: 0.1 }, target: 'ENTRY' },
    ],
  },
  'NEW-OFFICE-INSIDE': {
    panorama: '/office-12.jpg',
    markers: [
      { id: 'NEW-OFFICE-INSIDE-BACK', image: 'office-11.jpg', tooltip: 'Back to Office', position: { yaw: -3.55, pitch: -0.1 }, target: 'NEW-OFFICE' },
    ],
  },
  'STUDIO-OUTSIDE': {
    panorama: '/office-6.jpg',
    markers: [
      { id: 'TO-STUDIO', image: 'office-1.jpg', tooltip: 'Enter Studio', position: { yaw: 1.9, pitch: 0.05 }, target: 'STUDIO' },
      { id: 'STUDIO-OUTSIDE-BACK', image: 'office-15.jpg', tooltip: 'Back to Entry', position: { yaw: -0.6, pitch: 0.05 }, target: 'ENTRY' },
    ],
  },
  'STUDIO': {
    panorama: '/office-16.jpg',
    markers: [
      { id: 'STUDIO-BACK', image: 'office-6.jpg', tooltip: 'Back to Studio Outside', position: { yaw: -2.19, pitch: -0.18 }, target: 'STUDIO-OUTSIDE' },
    ],
  },
};


const ViewerComponent = () => {
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [showBot, setShowBot] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [botMessage, setBotMessage] = useState('');
  const [micPermission, setMicPermission] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const viewerRef = useRef(null);
  const markersPluginRef = useRef(null);
  const autorotateRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const loadVoices = () => synth.getVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  const speak = useCallback((text) => {
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    const voices = synth.getVoices();

    // Prefer female voice names
    const femaleVoice = voices.find(v =>
      v.lang === language &&
      /female|woman|zira|susan|google uk english female|en-gb/.test(v.name.toLowerCase())
    );

    const fallbackVoice = voices.find(v => v.lang === language);
    utterance.voice = femaleVoice || fallbackVoice;

    synth.speak(utterance);
  }, [language]);

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
          langData.keywords.some(keyword => transcript.includes(keyword))
        );

        if (matchedLang) {
          const newLangCode = matchedLang[1].code;
          setLanguage(newLangCode);
          recognition.lang = newLangCode;
          speak(`Language changed to ${matchedLang[0]}`);
          return;
        }

        const response = language.startsWith('hi') ? "नमस्ते! मैं निसा हूँ। कैसे मदद कर सकती हूँ?" :
                        language.startsWith('es') ? "¡Hola! Soy Nisaa. ¿Cómo puedo ayudarte?" :
                        language.startsWith('fr') ? "Bonjour! Je suis Nisaa. Comment puis-je vous aider?" :
                        "Hello! This is Nisaa. How can I assist you today?";

        setBotMessage(response);
        speak(response);
      };

      recognition.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          alert('Microphone permission denied.');
          setShowBot(false);
        }
      };

      recognition.onend = () => {
        if (showBot) {
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
  }, [micPermission, language, speak, showBot]);

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onend = null;
      recognition.stop();
      recognition.isStarted = false;
    }
  };

  const setSceneMarkers = useCallback((markerList) => {
    const plugin = markersPluginRef.current;
    plugin.clearMarkers();
    markerList.forEach(({ id, position, image, tooltip }) => {
      plugin.addMarker({
        id,
        position,
        tooltip,
        html: `<div class="custom-marker" style="background-image: url('${image}');"></div>`,
        anchor: 'center center',
      });
    });
  }, []);

  const switchToScene = useCallback(async (sceneId) => {
    const scene = scenes[sceneId];
    if (!scene) return;
    autorotateRef.current.stop();
    await viewerRef.current.setPanorama(scene.panorama);
    setSceneMarkers(scene.markers);
    autorotateRef.current.start();
  }, [setSceneMarkers]);

  useEffect(() => {
    const container = document.getElementById('app-viewer-container');
    const viewer = new Viewer({
      container,
      panorama: scenes.ENTRY.panorama,
      defaultZoomLvl: 30,
      navbar: navbarVisible ? ['autorotate', 'fullscreen'] : false,
      plugins: [
        MarkersPlugin,
        [AutorotatePlugin, { autorotateSpeed: 0.5 }],
      ],
    });

    viewerRef.current = viewer;
    markersPluginRef.current = viewer.getPlugin(MarkersPlugin);
    autorotateRef.current = viewer.getPlugin(AutorotatePlugin);
    autorotateRef.current.start();
    setSceneMarkers(scenes.ENTRY.markers);

    markersPluginRef.current.addEventListener('select-marker', (e) => {
      const target = Object.values(scenes).flatMap(s => s.markers).find(m => m.id === e.marker.id)?.target;
      if (target) switchToScene(target);
    });

    return () => {
      viewer.destroy();
      stopListening();
      stopSpeaking();
      recognitionRef.current = null;
    };
  }, [navbarVisible, setSceneMarkers, switchToScene]);

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (showBot) {
      if (['granted', 'prompt', 'unknown'].includes(micPermission)) {
   
        const greeting = language.startsWith('hi') ? "नमस्ते, मैं निसा हूँ।" :
                         language.startsWith('es') ? "¡Hola! Soy Nisaa." :
                         language.startsWith('fr') ? "Bonjour! Je suis Nisaa." :
                         "Hi, I'm Nisaa. Nice to meet you!";
        setBotMessage(greeting);
        speak(greeting);
      } else {
        alert('Microphone permission denied.');
        setShowBot(false  );
      }
    } else {  
      stopListening();
      stopSpeaking();
      setUserMessage('');
      setBotMessage('');
      setIsListening(false);
    }
  }, [showBot, startListening, micPermission, language, speak]);
  const toggleListening = () => {
  if (isListening) {
    stopListening();
    setIsListening(false);
  } else {
    startListening();
    setIsListening(true);
  }
};

  return (    
    <div>
      <style>{`
        .custom-marker {
          pointer-events: auto;
          cursor: pointer;
          width: 70px;
          height: 40px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
          animation: pulseGlow 2s infinite;
        }
        .custom-marker:hover {
          transform: scale(1.4);
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
          50% { box-shadow: 0 0 20px rgba(0,123,255,0.7); }
          100% { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
        }
        @keyframes floatBot {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <img src="/LOGO.png" alt="Logo" style={{ position: 'fixed', top: '10px', left: '10px', height: '50px', zIndex: 1000 }} />

    <button 
  onClick={() => setShowBot(prev => !prev)} 
  style={{
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    zIndex: 10,
    border: 'none',
    background: 'transparent',
    padding: 0,
    margin: 0,
    width: '100px',
    height: '100px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
>
  <img
    src="/nisaa.png"
    alt="Bot"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      background: 'transparent',
      transition: 'transform 0.3s ease-in-out'
    }}
  />
</button>


      <div id="app-viewer-container" style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />

 {showBot && (
  <div style={{
    position: 'fixed',
    bottom: '100px',
    left: '30px',
    width: '370px',
    borderRadius: '30px',
    background: 'linear-gradient(135deg, #f9f7ff 0%, #ece7ff 100%)',
    boxShadow: '0 12px 28px rgba(120, 0, 255, 0.15)',
    zIndex: 1000,
    fontFamily: "'Montserrat', sans-serif",
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px'
  }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap');

      .nisaa-bot-img {
        width: 120px;
        margin: 0 auto;
        border-radius: 50%;
        box-shadow: 0 0 35px rgba(170, 110, 255, 0.4);
        margin-bottom: 20px;
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
    `}</style>

    <img src="/nisaa.png" alt="Bot" className="nisaa-bot-img" />

    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
  {userMessage && (
    <div className="chat-bubble-user">{userMessage}</div>
  )}

  {botMessage && (
    <div className="chat-bubble-bot">
      <img src="/nisaa.png" className="bot-avatar" alt="bot avatar" style={{ width: '40px', height: '40px' }} />
      <div>
        {botMessage.includes("<ul") ? (
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
  onClick={() => {
    if (!userMessage.trim()) return;

const lowerMsg = userMessage.toLowerCase();

const simulatedResponse =
  lowerMsg.includes("what is") || lowerMsg.includes("raising 100x")
    ? "Raising 100X is a growth-focused marketing company helping brands scale rapidly using data-driven strategies."
  : lowerMsg.includes("employees") || lowerMsg.includes("staff") || lowerMsg.includes("team")
    ? "We have a talented team of over 20 professionals across strategy, content, performance marketing, and design."
  : lowerMsg.includes("ceo") || lowerMsg.includes("founder") || lowerMsg.includes("leader")
    ? "Our CEO is Mr. Ibrahim Abdulla, a marketing visionary with years of experience scaling brands."
  : lowerMsg.includes("services") || lowerMsg.includes("offerings") || lowerMsg.includes("solutions")
    ? "We offer branding, performance marketing, SEO, social media strategy, content creation, and marketing automation services."
  : lowerMsg.includes("contact") || lowerMsg.includes("reach") || lowerMsg.includes("email")
    ? "You can contact us at contact@raising100x.com or fill out the form on our website."
  : lowerMsg.includes("location") || lowerMsg.includes("based") || lowerMsg.includes("office")
    ? "We are based in India, with a digital-first team supporting clients worldwide."
  : lowerMsg.includes("meeting") || lowerMsg.includes("appointment") || lowerMsg.includes("book")
    ? "You can book a consultation with us here: <a href='https://calendly.com' target='_blank'>Book a Call</a>."
  : lowerMsg.includes("clients") || lowerMsg.includes("portfolio") || lowerMsg.includes("worked with")
    ? "We’ve worked with startups and enterprises across tech, fashion, and education. Want to see case studies?"
  : lowerMsg.includes("why") || lowerMsg.includes("different") || lowerMsg.includes("unique")
    ? "We combine data science with storytelling to deliver rapid growth marketing solutions."
  : lowerMsg.includes("hiring") || lowerMsg.includes("careers") || lowerMsg.includes("jobs")
    ? "Yes! We're hiring. Send your CV to careers@raising100x.com or visit our Careers page."
  : "I'm Nisaa, your assistant from Raising 100X. Ask me anything about our services, team, or how to get started!";

setBotMessage(simulatedResponse);
speak(simulatedResponse);
setUserMessage('');
  }}
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
        cursor: 'pointer'
      }}
      title={isListening ? 'Stop listening' : 'Start listening'}
    >
      <img src="/mic.png" alt="mic" style={{ width: '32px' }} />
    </div>
  </div>
</div>

  </div>
)}

      </div>  
      
  );
};

export default ViewerComponent;
  