import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';

import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import 'font-awesome/css/font-awesome.min.css';

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

  useEffect(() => {
    if (showBot) {
      if (['granted', 'prompt', 'unknown'].includes(micPermission)) {
        startListening();
        const greeting = language.startsWith('hi') ? "नमस्ते, मैं निसा हूँ।" :
                         language.startsWith('es') ? "¡Hola! Soy Nisaa." :
                         language.startsWith('fr') ? "Bonjour! Je suis Nisaa." :
                         "Hi, I'm Nisaa. Nice to meet you!";
        setBotMessage(greeting);
        speak(greeting);
      } else {
        alert('Microphone permission denied.');
        setShowBot(false);
      }
    } else {
      stopListening();
      stopSpeaking();
      setUserMessage('');
      setBotMessage('');
    }
  }, [showBot, startListening, micPermission, language, speak]);

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

      <button onClick={() => setNavbarVisible(prev => !prev)} style={{
        position: 'absolute', top: '10px', right: '10px', padding: '10px',
        backgroundColor: 'rgba(0, 123, 255, 0.4)', color: 'white',
        border: 'none', cursor: 'pointer', zIndex: 10
      }}>
        <i className={`fa ${navbarVisible ? 'fa-eye-slash' : 'fa-eye'}`} />
      </button>

      <button onClick={() => setShowBot(prev => !prev)} style={{
        position: 'absolute', bottom: '20px', left: '20px', zIndex: 10,
        background: '#fff', border: 'none', borderRadius: '50%',
        width: '50px', height: '50px', fontSize: '20px', cursor: 'pointer'
      }}>
<img
  src="/bot.png" // Replace with your actual GIF path
  alt="Mic"
  style={{
    width: '24px',
    height: '24px',
    objectFit: 'contain',
    filter: `drop-shadow(0 0 4px #a259ff) drop-shadow(0 0 8px #c175ff) drop-shadow(0 0 12px #7a1fff)`,
    transition: 'filter 0.3s ease-in-out',
  }}
/>
      </button>

      <div id="app-viewer-container" style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />

   {showBot && (
  <div style={{
    position: 'fixed',
    bottom: '100px',
    left: '30px',
    width: '360px',
    maxHeight: '80vh',
    padding: '24px',
    borderRadius: '28px',
    background: 'radial-gradient(ellipse at center, #0f0f16 0%, #1a1a29 90%)',
    boxShadow: '0 0 30px 4px rgba(120, 0, 255, 0.6)',
    color: '#eee',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid rgba(128, 0, 255, 0.5)',
    animation: 'fadeInBot 0.5s ease-out',
    fontFamily: "'Montserrat', sans-serif",
  }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap');

      @keyframes fadeInBot {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .bot-heading {
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        font-size: 32px;
        text-align: center;
        color: #a259ff;
        text-shadow:
          0 0 5px #a259ff,
          0 0 15px #c175ff,
          0 0 25px #c175ff,
          0 0 40px #7a1fff;
        margin-bottom: 18px;
        user-select: none;
        letter-spacing: 1.5px;
      }

      .bot-avatar {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        margin: 0 auto 22px;
        border: 3px solid #a259ff;
        box-shadow: 0 0 15px #a259ff;
        animation: pulseBorder 3s infinite ease-in-out;
        background: radial-gradient(circle at center, #6a00ff 0%, #3a00bb 100%);
      }

      @keyframes pulseBorder {
        0%, 100% { box-shadow: 0 0 15px #a259ff; }
        50% { box-shadow: 0 0 30px #c175ff; }
      }

      .user-msg {
        margin-bottom: 14px;
        background: #2c1a54;
        border-radius: 14px;
        padding: 12px 16px;
        font-size: 14px;
        color: #ddd;
        box-shadow: inset 0 0 10px rgba(193, 117, 255, 0.4);
      }

      .bot-msg {
        background: linear-gradient(90deg, #a259ff 0%, #c175ff 100%);
        color: #1e1b28;
        border-radius: 14px;
        padding: 12px 16px;
        font-size: 14px;
        box-shadow: 0 5px 15px rgba(193, 117, 255, 0.6);
      }
    `}</style>

    <div className="bot-heading">Nisaa</div>

    <img src="/bot.gif" alt="Bot" className="bot-avatar" />

    <div className="user-msg">
      <strong style={{ color: '#c9b6ff' }}>You:</strong><br />
      {userMessage || <span style={{ color: '#7a4bff' }}>Listening...</span>}
    </div>

    <div className="bot-msg">
      <strong>Bot (Nisaa):</strong><br />
      {botMessage}
    </div>
  </div>
)}

      </div>  
      
  );
};

export default ViewerComponent;
