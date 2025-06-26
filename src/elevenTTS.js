// src/elevenTTS.js

import { ELEVENLABS_API_KEY, AMELIA_VOICE_ID } from './config';

const languageHints = {
  en: "Hello, how can I help you today?",
  hi: "नमस्ते, मैं आपकी किस प्रकार सहायता कर सकती हूँ?",
  fr: "Bonjour, comment puis-je vous aider aujourd'hui ?",
  es: "Hola, ¿cómo puedo ayudarte hoy?",
  de: "Hallo, wie kann ich Ihnen helfen?",
};

const playVoice = async (text, langCode = 'en') => {
  const hint = languageHints[langCode] || languageHints.en;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${AMELIA_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.75,
      },
      // Hint ElevenLabs which language you're using (it auto detects too, but this helps)
      lang: langCode,
      text_prompt: hint
    }),
  });

  if (!response.ok) {
    console.error("Voice API failed:", await response.text());
    return;
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};

export { playVoice };
