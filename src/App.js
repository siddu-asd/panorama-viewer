import React, { useState } from 'react';
import ViewerComponent from './ViewerComponent';
import ChatBot2 from './ChatBot2';

const App = () => {
  const [showBot, setShowBot] = useState(false);

  const toggleChatBot = () => {
    setShowBot((prev) => !prev);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ViewerComponent toggleChatBot={toggleChatBot} />
      <ChatBot2 isVisible={showBot} toggleChatBot={toggleChatBot} />
    </div>
  );
};

export default App;