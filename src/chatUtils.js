const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

const API_BASE = 'https://m-touch-labs.onrender.com/';

export const supportedLanguages = {
  hindi: { code: 'hi-IN', keywords: ['hindi', 'speak in hindi', 'change language to hindi'] },
  telugu: { code: 'te-IN', keywords: ['telugu', 'speak in telugu', 'change language to telugu'] },
  tamil: { code: 'ta-IN', keywords: ['tamil', 'speak in tamil', 'change language to tamil'] },
  bengali: { code: 'bn-IN', keywords: ['bengali', 'speak in bengali', 'change language to bengali'] },
  marathi: { code: 'mr-IN', keywords: ['marathi', 'speak in marathi', 'change language to marathi'] },
  kannada: { code: 'kn-IN', keywords: ['kannada', 'speak in kannada', 'change language to kannada'] },
  malayalam: { code: 'ml-IN', keywords: ['malayalam', 'speak in malayalam', 'change language to malayalam'] },
  english: { code: 'en-IN', keywords: ['english', 'speak in english', 'change language to english'] },
};

export const getVoices = () => {
  return new Promise((resolve) => {
    let voices = synth.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    synth.onvoiceschanged = () => {
      voices = synth.getVoices();
      resolve(voices);
      synth.onvoiceschanged = null;
    };
  });
};

export const testAPIConnection = () => {
  fetch(`${API_BASE}/health`)
    .then((res) => res.text())
    .then((data) => console.log('Health check response:', data))
    .catch((err) => console.error('Health check failed:', err));
};

export const speak = async (text, messageId, language, voices, mutedMessages, setIsSpeaking, setMessages) => {
  if (!synth || (messageId && mutedMessages.has(messageId))) return;

  synth.cancel();
  setIsSpeaking(true);

  const availableVoices = voices.length > 0 ? voices : await getVoices();
  const utterance = new SpeechSynthesisUtterance(text.replace(/([.!?])\s*/g, '$1... '));
  utterance.lang = language;

  let selectedVoice = availableVoices.find(v => v.lang === language);
  if (!selectedVoice) {
    const langPrefix = language.split('-')[0];
    selectedVoice = availableVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
  }

  if (!selectedVoice) {
    selectedVoice = availableVoices.find(v => v.lang === 'en-US') || availableVoices[0];
    const langName = Object.keys(supportedLanguages).find(k => supportedLanguages[k].code === language);
    if (setMessages && langName) {
      setMessages(prev => [...prev, {
        id: `bot-warning-${Date.now()}`,
        type: 'bot',
        content: `Sorry, ${langName} voice is not available in this browser. Using fallback.`,
        displayedContent: `Sorry, ${langName} voice is not available in this browser. Using fallback.`,
        isTyping: false,
      }]);
    }
  }

  utterance.voice = selectedVoice;
  utterance.rate = 0.9;
  utterance.pitch = 1.15;
  utterance.volume = 1;

  utterance.onstart = () => setIsSpeaking(true);
  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = (event) => {
    if (event.error !== 'interrupted') {
      console.error('Speech error:', event.error);
    }
    setIsSpeaking(false);
  };

  try {
    synth.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis error:', error);
    setIsSpeaking(false);
  }
};

export const stopSpeaking = (setIsSpeaking) => {
  if (synth) {
    synth.cancel();
    setIsSpeaking(false);
  }
};

export const initializeSpeechRecognition = (language, setIsListening, setUserMessage) => {
  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => setIsListening(true);
  recognition.onresult = (event) => setUserMessage(event.results[0][0].transcript);
  recognition.onerror = (event) => {
    setIsListening(false);
    if (event.error === 'not-allowed') alert('Please allow microphone access.');
  };
  recognition.onend = () => setIsListening(false);

  return recognition;
};
