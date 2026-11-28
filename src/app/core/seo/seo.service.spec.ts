import { DOCUMENT } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, expect, it } from 'vitest';
import english from '../../../../public/i18n/en.json';
import spanish from '../../../../public/i18n/es.json';
import { provideTestI18n } from '../../../../tests/fixtures/i18n-testing';
import { I18nService } from '../i18n/i18n.service';
import site from './site-config.json';

afterEach(() => {
  document.head.querySelectorAll('meta, link[rel="canonical"], link[rel="alternate"]').forEach((node) => node.remove());
});

it('synchronizes localized metadata across language changes and direct router navigation without duplicates', async () => {
  TestBed.configureTestingModule({ providers: [...provideTestI18n(), provideLocationMocks()] });
  const i18n = TestBed.inject(I18nService);
  const document = TestBed.inject(DOCUMENT);
  await i18n.initialize();
  const check = (language: 'en' | 'es') => {
    const { app } = language === 'es' ? spanish : english;
    const url = new URL(site.paths[language], site.url).href;
    expect(document.documentElement.lang).toBe(language);
    expect(document.title).toBe(app.documentTitle);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(app.description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(url);
    for (const [selector, expected] of Object.entries({
      'meta[property="og:title"]': app.documentTitle,
      'meta[property="og:description"]': app.description,
      'meta[property="og:url"]': url,
      'meta[property="og:locale"]': site.locales[language],
      'meta[name="twitter:title"]': app.documentTitle,
      'meta[name="twitter:description"]': app.description,
      'meta[name="twitter:image"]': new URL(site.image, site.url).href,
    })) {
      expect(document.querySelectorAll(selector)).toHaveLength(1);
      expect(document.querySelector(selector)?.getAttribute('content')).toBe(expected);
    }
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(3);
    expect(document.querySelector('link[hreflang="en"]')?.getAttribute('href')).toBe(site.url);
    expect(document.querySelector('link[hreflang="es"]')?.getAttribute('href')).toBe(new URL('es/', site.url).href);
  };
  check('en');
  await i18n.setLanguage('es');
  check('es');
  await TestBed.inject(Router).navigateByUrl('/?utm_source=test#ninja-2');
  await i18n.setLanguage('en');
  check('en');
});
