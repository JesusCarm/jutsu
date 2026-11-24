import type { TranslationKey } from './i18n-keys';

export class TranslationError extends Error {
  constructor(readonly key: TranslationKey) { super(key); }
}
