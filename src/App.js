import React, { useState, useEffect } from 'react';
import ViewerComponent from './components/ViewerComponent';
import ChatBot2 from './components/ChatBot2';
import './components/i18n';
import { useTranslation } from 'react-i18next';

const App = () => {
  const { t, i18n } = useTranslation();
  const [showBot, setShowBot] = useState(true);
  const [currentScene, setCurrentScene] = useState(() => {
    // Handle hash-based URLs (e.g., /#panorama?scene=ROOM1)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const scene = params.get('scene')?.toUpperCase() || 'ENTRY';
    console.log('Initial scene from URL:', scene, 'Hash:', hash);
    return scene;
  });
  const [messages, setMessages] = useState(() => {
    const storedMessages = localStorage.getItem('chatMessages');
    console.log('Initial messages from localStorage:', storedMessages);
    return storedMessages ? JSON.parse(storedMessages) : [
      {
        id: 'welcome',
        type: 'bot',
        content: "Welcome! I'm Nisaa, your assistant from Raising 100X. Ask me about our 360° office tour or anything else!",
        displayedContent: "Welcome! I'm Nisaa, your assistant from Raising 100X. Ask me about our 360° office tour or anything else!",
        isTyping: false,
      },
    ];
  });
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
      window.location.href = `/#panorama?scene=${scene}`;
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
  }, []); // Run once on mount

  // Persist messages to localStorage
  useEffect(() => {
    console.log('Saving messages to localStorage:', messages.length);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  // Clear localStorage on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Tab closing, clearing localStorage');
      localStorage.removeItem('chatSessionId');
      localStorage.removeItem('chatMessages');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Update scene on URL change
  useEffect(() => {
    const handlePopstate = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const newScene = params.get('scene')?.toUpperCase() || 'ENTRY';
      console.log('Popstate detected, updating scene to:', newScene);
      if (newScene !== currentScene) {
        setCurrentScene(newScene);
      }
    };
    window.addEventListener('popstate', handlePopstate);
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
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