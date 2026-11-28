import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { expect, it } from 'vitest';
import english from '../public/i18n/en.json';
import spanish from '../public/i18n/es.json';
import site from '../src/app/core/seo/site-config.json';
import { localizeEntry, writeSeoPages } from '../scripts/write-seo-pages.mjs';

const template = await readFile('src/index.html', 'utf8');

it.each([['en', english], ['es', spanish]])('provides crawlable %s content and social metadata without JavaScript', (language, dictionary) => {
  const dom = new JSDOM(localizeEntry(template, language, dictionary));
  const { document } = dom.window;
  expect(document.documentElement.lang).toBe(language);
  expect(document.title).toBe(dictionary.app.documentTitle);
  expect(document.querySelector('h1').textContent).toBe(dictionary.app.heading);
  expect(document.querySelector('[data-seo="introduction"]').textContent).toBe(dictionary.app.introduction);
  expect(document.querySelector('noscript').textContent).toContain(dictionary.app.javascriptRequired);
  const url = new URL(site.paths[language], site.url).href;
  expect(document.querySelector('link[rel="canonical"]').href).toBe(url);
  expect(document.querySelector('meta[property="og:url"]').content).toBe(url);
  expect(document.querySelector('meta[property="og:locale"]').content).toBe(site.locales[language]);
  expect(document.querySelector('meta[name="description"]').content).toBe(dictionary.app.description);
  expect(document.querySelector('meta[property="og:title"]').content).toBe(dictionary.app.documentTitle);
  expect(document.querySelector('meta[name="twitter:description"]').content).toBe(dictionary.app.description);
  expect(document.querySelectorAll('link[rel="alternate"]')).toHaveLength(3);
  expect(document.querySelector('a[hreflang="es"]').getAttribute('href')).toBe('/es/');
  expect(document.querySelector('script').getAttribute('src')).toBe('runtime-config.js');
  dom.window.close();
});

it('writes both HTML entries and valid discovery files containing only the canonical pages', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'jutsu-seo-'));
  try {
    await writeFile(join(directory, 'index.html'), template);
    await writeSeoPages(pathToFileURL(directory + '/'));
    expect(await readFile(join(directory, 'index.html'), 'utf8')).toContain('<html lang="en">');
    expect(await readFile(join(directory, 'es/index.html'), 'utf8')).toContain('<html lang="es">');
    const robots = await readFile(join(directory, 'robots.txt'), 'utf8');
    expect(robots).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${site.url}sitemap.xml\n`);
    const sitemap = new JSDOM(await readFile(join(directory, 'sitemap.xml'), 'utf8'), { contentType: 'application/xml' });
    expect(sitemap.window.document.documentElement.namespaceURI).toBe('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect([...sitemap.window.document.querySelectorAll('loc')].map((node) => node.textContent)).toEqual([site.url, site.url + 'es/']);
    sitemap.window.close();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('uses the same English fallback as the editor for missing or empty translated introductory copy', () => {
  const dom = new JSDOM(localizeEntry(template, 'es', { app: { ...spanish.app, heading: null, introduction: ' ' } }));
  expect(dom.window.document.querySelector('h1').textContent).toBe(english.app.heading);
  expect(dom.window.document.querySelector('[data-seo="introduction"]').textContent).toBe(english.app.introduction);
  expect(dom.window.document.title).toBe(spanish.app.documentTitle);
  dom.window.close();
});
