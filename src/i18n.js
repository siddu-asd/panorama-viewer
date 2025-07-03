import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import hi from './locales/hi/translation.json';
import te from './locales/te/translation.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  hi: { translation: hi },
  te: { translation: te },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n; 