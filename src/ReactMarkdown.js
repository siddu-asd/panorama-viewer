import ReactMarkdown from 'react-markdown';

const BotResponse = ({ response }) => {
  return (
    <div className="markdown-response">
      <ReactMarkdown>{response}</ReactMarkdown>
    </div>
  );
};
