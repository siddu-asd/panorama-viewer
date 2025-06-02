import React, { useState } from 'react';
import ViewerComponent from './ViewerComponent';
import ChatBot from './ChatBot';

const App = () => {
  const [showBot, setShowBot] = useState(false);

  const toggleChatBot = () => {
    setShowBot((prev) => !prev);
  };

  return (
    <div>
      <ViewerComponent toggleChatBot={toggleChatBot} />
      <ChatBot isVisible={showBot} toggleChatBot={toggleChatBot} />
    </div>
  );
};

export default App;