import React, { useState } from 'react';
import ViewerComponent from './components/ViewerComponent';
import ChatBot2 from './components/ChatBot2';
import './components/i18n';
import { useTranslation } from 'react-i18next';

const App = () => {
  const { t, i18n } = useTranslation();
  const [showBot, setShowBot] = useState(false);
  const [currentScene, setCurrentScene] = useState('ENTRY');

  const toggleChatBot = () => {
    setShowBot((prev) => !prev);
  };

  const handleNavigate = (scene) => {
    setCurrentScene(scene);
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Main App Content */}
      <h1 style={{ visibility: 'hidden', height: 0, margin: 0 }}>{t('welcome')}</h1>
      <ViewerComponent toggleChatBot={toggleChatBot} currentScene={currentScene} onNavigate={handleNavigate} />
      <ChatBot2 isVisible={showBot} toggleChatBot={toggleChatBot} />
    </div>
  );
};

export default App;