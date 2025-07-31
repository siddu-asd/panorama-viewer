import React, { useState, useEffect } from 'react';
import ViewerComponent from './components/ViewerComponent';
import ChatBot2 from './components/ChatBot2';
import './components/i18n';
import { useTranslation } from 'react-i18next';

const App = () => {
  const { t, i18n } = useTranslation();
  const [showBot, setShowBot] = useState(true); // Chat visible by default
  const [currentScene, setCurrentScene] = useState('ENTRY');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      content: "Welcome! I'm Nisaa, your assistant from Raising 100X. Ask me about our 360° office tour or anything else!",
      displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X. Ask me about our 360° office tour or anything else!",
      isTyping: false,
    },
  ]);
  const [sessionId, setSessionId] = useState(() => {
    const storedId = localStorage.getItem('chatSessionId');
    console.log('Initial session ID from localStorage:', storedId);
    return storedId || '';
  });

  const toggleChatBot = () => {
    console.log('Toggling chat bot, showBot:', !showBot);
    setShowBot((prev) => !prev);
  };

  const switchToScene = (scene) => {
    if (scene && scene !== currentScene) {
      console.log('Switching scene to:', scene, 'Current session ID:', sessionId);
      setCurrentScene(scene);
      window.history.pushState({}, '', `/#panorama?scene=${scene}`);
    }
  };

  // Initialize session ID only once
  useEffect(() => {
    if (!sessionId) {
      console.log('Fetching new session ID');
      fetch('http://127.0.0.1:5000/generate_session')
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          const newSessionId = data.session_id || `fallback-${Date.now()}`;
          console.log('New session ID:', newSessionId);
          setSessionId(newSessionId);
          localStorage.setItem('chatSessionId', newSessionId);
        })
        .catch(() => {
          const fallbackId = `fallback-${Date.now()}`;
          console.log('Fallback session ID:', fallbackId);
          setSessionId(fallbackId);
          localStorage.setItem('chatSessionId', fallbackId);
        });
    }
  }, [sessionId]); // Dependency on sessionId to handle manual resets

  // Handle initial scene from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sceneFromUrl = params.get('scene')?.toUpperCase();
    if (sceneFromUrl && sceneFromUrl !== currentScene) {
      console.log('Setting scene from URL:', sceneFromUrl);
      setCurrentScene(sceneFromUrl);
    }
  }, [currentScene]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <h1 style={{ visibility: 'hidden', height: 0, margin: 0 }}>{t('welcome')}</h1>
      <ViewerComponent
        toggleChatBot={toggleChatBot}
        currentScene={currentScene}
        switchToScene={switchToScene}
      />
      <ChatBot2
        isVisible={showBot}
        toggleChatBot={toggleChatBot}
        switchToScene={switchToScene}
        messages={messages}
        setMessages={setMessages}
        sessionId={sessionId}
        selectedLanguage={i18n.language}
      />
    </div>
  );
};

export default App;