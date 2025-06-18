import React from 'react';
import ReactMarkdown from 'react-markdown';

const BotResponse = ({ content }) => {
  return (
    <div className="message-text markdown-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default BotResponse;
