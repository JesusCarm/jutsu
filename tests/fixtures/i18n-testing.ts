import { provideRouter } from '@angular/router';
import english from '../../public/i18n/en.json';
import spanish from '../../public/i18n/es.json';
import { TRANSLATION_FETCH, type TranslationFetch } from '../../src/app/core/i18n/i18n.service';
import { routes } from '../../src/app/app.routes';

/** Test providers use the real dictionaries without network requests. */
export function provideTestI18n() {
  const load: TranslationFetch = async (url) => url.endsWith('/es.json') ? spanish : english;
  return [provideRouter(routes), { provide: TRANSLATION_FETCH, useValue: load }];
}
