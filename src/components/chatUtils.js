const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const API_BASE = 'https://nissa-chat-bot.onrender.com';

export const testAPIConnection = () => {
  fetch(`${API_BASE}/health`)
    .then((res) => res.text())
    .then((data) => console.log('Health check response:', data))
    .catch((err) => console.error('Health check failed:', err));
};

export const initializeSpeechRecognition = (language, setIsListening, setUserMessage) => {
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language || 'en-IN';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => setIsListening(true);
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setUserMessage(transcript);
    setIsListening(false);
  };
 recognition.onerror = (event) => {
  setIsListening(false);
  if (event.error === 'not-allowed') {
    alert('Please allow microphone access.');
  } else if (event.error === 'no-speech') {
    alert('No speech detected. Please try speaking louder or closer to the mic.');
  } else {
    console.error('Speech recognition error:', event.error);
  }
};
  recognition.onend = () => setIsListening(false);

  return recognition;
};
