import type { TranslationKey } from './i18n-keys';

export type TranslationParams = Readonly<Record<string, string | number | undefined>>;
export interface TranslationMessage { readonly key: TranslationKey; readonly params?: TranslationParams; }

/** An immutable view of loaded dictionaries, also usable by the Angular-free PDF pipeline. */
export class TranslationDictionary {
  private readonly english: ReadonlyMap<string, string>;
  private readonly active: ReadonlyMap<string, string>;

  constructor(english: unknown = {}, active: unknown = {}) {
    this.english = this.flatten(english);
    this.active = this.flatten(active);
  }

  t(key: TranslationKey, params: TranslationParams = {}): string {
    const text = this.active.get(key) ?? this.english.get(key) ?? key;
    return text.replace(/\{(\w+)\}/g, (token: string, name: string) => {
      const value = params[name];
      return value === undefined ? token : String(value);
    });
  }

  private flatten(data: unknown): ReadonlyMap<string, string> {
    const result = new Map<string, string>();
    const visit = (value: unknown, prefix: string): void => {
      if (typeof value === 'string' && value.trim()) result.set(prefix, value);
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value)) visit(child, prefix ? `${prefix}.${key}` : key);
      }
    };
    visit(data, '');
    return result;
  }
}
