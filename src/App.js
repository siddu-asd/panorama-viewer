import React, { useState } from 'react';
import ViewerComponent from './ViewerComponent';
import ChatBot2 from './ChatBot2';
import VerticalNav from './components/VerticalNav';

const App = () => {
  const [showBot, setShowBot] = useState(false);
  const [currentScene, setCurrentScene] = useState('ENTRY');

  const toggleChatBot = () => {
    setShowBot((prev) => !prev);
  };

  const handleNavigate = (scene) => {
    setCurrentScene(scene);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      <VerticalNav onNavigate={handleNavigate} currentScene={currentScene} />
      <ViewerComponent toggleChatBot={toggleChatBot} currentScene={currentScene} onNavigate={handleNavigate} />
      <ChatBot2 isVisible={showBot} toggleChatBot={toggleChatBot} />
    </div>
  );
};

export default App;