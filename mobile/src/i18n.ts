import type { Language } from '@/src/providers/preferences-provider';

const translations = {
  en: { language: 'Language', slovak: 'Slovak', english: 'English', home: 'Home', settings: 'Settings', workouts: 'Workouts' },
  sk: { language: 'Jazyk', slovak: 'Slovenčina', english: 'Angličtina', home: 'Domov', settings: 'Nastavenia', workouts: 'Tréningy' },
} as const;

export const translate = (language: Language, key: keyof (typeof translations)['en']) => translations[language][key];
