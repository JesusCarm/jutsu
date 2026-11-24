import { App } from './i18n-keys';

export const LANGUAGES = [
  { id: 'en', label: App.english, icon: 'flagEn' },
  { id: 'es', label: App.spanish, icon: 'flagEs' },
] as const;
export type Language = typeof LANGUAGES[number]['id'];
export const DEFAULT_LANGUAGE: Language = 'en';
export function supportedLanguage(value: string | null): Language {
  return LANGUAGES.find((language) => language.id === value)?.id ?? DEFAULT_LANGUAGE;
}
