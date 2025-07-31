const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const API_BASE = 'https://nissa-chat-bot.onrender.com';

export const testAPIConnection = () => {
  fetch(`${API_BASE}/health`)
    .then((res) => res.text())
    .then((data) => console.log('Health check response:', data))
    .catch((err) => console.error('Health check failed:', err));
};

export const initializeSpeechRecognition = (language, setIsListening, handleTranscript) => {
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language || 'en-IN';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log('Speech recognition started');
    setIsListening(true);
  };

  recognition.onresult = (event) => {
    console.log('Speech recognition result:', event);
    const transcript = event.results[0][0].transcript;
    console.log('Transcript:', transcript);
    handleTranscript(transcript);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    if (event.error === 'not-allowed') {
      alert('Please allow microphone access.');
    } else if (event.error === 'no-speech') {
      console.log('No speech detected');
    } else {
      console.error('Speech recognition error:', event.error);
    }
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
    setIsListening(false);
  };

  return recognition;
};
