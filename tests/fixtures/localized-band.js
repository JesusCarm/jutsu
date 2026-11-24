import english from '../../public/i18n/en.json';
import spanish from '../../public/i18n/es.json';
import { GameText } from '../../src/app/core/i18n/game-text';
import { TranslationDictionary } from '../../src/app/core/i18n/translation-dictionary';

export function localizeBand(band, language = 'en') {
  return new GameText(new TranslationDictionary(english, language === 'es' ? spanish : english))
    .band(JSON.parse(JSON.stringify(band)));
}
