import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { App } from '../i18n/i18n-keys';
import type { Language } from '../i18n/languages';
import type { TranslationDictionary } from '../i18n/translation-dictionary';
import site from './site-config.json';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  update(language: Language, dictionary: TranslationDictionary): void {
    const title = dictionary.t(App.documentTitle);
    const description = dictionary.t(App.description);
    const url = new URL(site.paths[language], site.url).href;
    this.document.documentElement.lang = language;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    for (const [property, content] of Object.entries({
      'og:type': 'website', 'og:site_name': 'Jutsu Band Builder',
      'og:title': title, 'og:description': description, 'og:url': url,
      'og:locale': site.locales[language],
      'og:image': new URL(site.image, site.url).href,
      'og:image:width': '512', 'og:image:height': '512',
      'og:image:alt': 'Jutsu — Gipsy Games',
    })) this.meta.updateTag({ property, content });
    for (const [name, content] of Object.entries({
      'twitter:card': 'summary', 'twitter:title': title, 'twitter:description': description,
      'twitter:image': new URL(site.image, site.url).href, 'twitter:image:alt': 'Jutsu — Gipsy Games',
    })) this.meta.updateTag({ name, content });
    this.link('canonical', url);
    for (const language of ['en', 'es'] as const) {
      this.link('alternate', new URL(site.paths[language], site.url).href, language);
    }
    this.link('alternate', site.url, 'x-default');
  }

  private link(rel: string, href: string, language?: string): void {
    const selector = `link[rel="${rel}"]${language ? `[hreflang="${language}"]` : ''}`;
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      if (language) link.hreflang = language;
      this.document.head.append(link);
    }
    link.href = href;
  }
}
