import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to Raising 100X',
      chatbot_title: 'Chat with Nisaa',
      type_message: 'Type your message...',
      send_message: 'Send message',
      start_listening: 'Start listening',
      stop_listening: 'Stop listening',
      scene_entry: 'Main Entry',
      scene_room1: 'Office Room',
      scene_admin_block: 'Admin Block',
      scene_meeting_room: 'Meeting Room',
      scene_workspace: 'Workspace',
      scene_new_office: 'New Office',
      scene_new_office_inside: 'New Office Interior',
      scene_studio_outside: 'Studio Entrance',
      scene_studio: 'Studio',
      exit: 'Exit',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;