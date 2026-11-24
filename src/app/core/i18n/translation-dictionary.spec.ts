import { describe, expect, it } from 'vitest';
import { App, Labels, Messages } from './i18n-keys';
import { TranslationDictionary } from './translation-dictionary';

describe('Translation dictionary', () => {
  it('falls back from active text to English and then to the typed key', () => {
    const dictionary = new TranslationDictionary({ app: { title: 'JUTSU', subtitle: 'Squad editor' } }, { app: { title: 'JUTSU ES', subtitle: null } });
    expect(dictionary.t(App.title)).toBe('JUTSU ES');
    expect(dictionary.t(App.subtitle)).toBe('Squad editor');
    expect(dictionary.t(Messages.ready)).toBe(Messages.ready);
    expect(new TranslationDictionary({ app: { title: 'English' } }, { app: { title: '  ' } }).t(App.title)).toBe('English');
  });

  it('interpolates zero and user text without reinterpreting it as a replacement expression', () => {
    const dictionary = new TranslationDictionary({ labels: { ninja: 'Ninja {number}', editNamedNinja: 'Edit {name}' } });
    expect(dictionary.t(Labels.ninja, { number: 0 })).toBe('Ninja 0');
    expect(dictionary.t(Labels.editNamedNinja, { name: '$& {number}' })).toBe('Edit $& {number}');
  });

  it('keeps snapshots independent of changes to the source objects', () => {
    const data = { app: { title: 'Original' } };
    const dictionary = new TranslationDictionary(data);
    data.app.title = 'Changed';
    expect(dictionary.t(App.title)).toBe('Original');
  });
});
