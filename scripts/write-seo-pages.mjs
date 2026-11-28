import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = pathToFileURL(process.cwd() + '/');
const site = JSON.parse(await readFile(new URL('src/app/core/seo/site-config.json', root), 'utf8'));
const english = JSON.parse(await readFile(new URL('public/i18n/en.json', root), 'utf8'));

/** Localize the built HTML entry without executing the editor or requiring a server runtime. */
export function localizeEntry(html, language, dictionary) {
  // This is an HTML transform; jsdom's CSS support is not needed for Angular's inline styles.
  const dom = new JSDOM(html, { virtualConsole: new VirtualConsole() });
  const document = dom.window.document;
  const url = new URL(site.paths[language], site.url).href;
  const localized = Object.fromEntries(Object.entries(dictionary.app ?? {})
    .filter(([, value]) => typeof value === 'string' && value.trim()));
  const app = { ...english.app, ...localized };
  document.documentElement.lang = language;
  document.title = app.documentTitle;
  const content = (selector, value) => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing SEO element: ${selector}`);
    element.setAttribute('content', value);
  };
  content('meta[name="description"]', app.description);
  for (const prefix of ['og', 'twitter']) {
    const attribute = prefix === 'og' ? 'property' : 'name';
    content(`meta[${attribute}="${prefix}:title"]`, app.documentTitle);
    content(`meta[${attribute}="${prefix}:description"]`, app.description);
    content(`meta[${attribute}="${prefix}:image"]`, new URL(site.image, site.url).href);
  }
  content('meta[property="og:url"]', url);
  content('meta[property="og:locale"]', site.locales[language]);
  document.querySelector('link[rel="canonical"]').setAttribute('href', url);
  for (const [lang, path] of Object.entries(site.paths)) {
    document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`).setAttribute('href', new URL(path, site.url).href);
    const link = document.querySelector(`a[hreflang="${lang}"]`);
    // Resolve navigation relative to the Angular base, including subdirectory deployments.
    link.setAttribute('href', document.querySelector('base').getAttribute('href') + path);
  }
  document.querySelector('link[hreflang="x-default"]').setAttribute('href', site.url);
  for (const key of ['heading', 'introduction', 'javascriptRequired']) {
    document.querySelector(`[data-seo="${key}"]`).textContent = app[key];
  }
  document.querySelector('[data-seo="language"]').setAttribute('aria-label', app.language);
  const result = dom.serialize();
  dom.window.close();
  return result;
}

export async function writeSeoPages(directory) {
  const template = await readFile(new URL('index.html', directory), 'utf8');
  for (const [language, path] of Object.entries(site.paths)) {
    const dictionary = JSON.parse(await readFile(new URL(`public/i18n/${language}.json`, root), 'utf8'));
    const output = new URL(path, directory);
    await mkdir(output, { recursive: true });
    await writeFile(new URL('index.html', output), localizeEntry(template, language, dictionary));
  }
  const urls = Object.values(site.paths).map((path) => `  <url><loc>${new URL(path, site.url).href}</loc></url>`).join('\n');
  await writeFile(new URL('sitemap.xml', directory), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(new URL('robots.txt', directory), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', site.url).href}\n`);
}

if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeSeoPages(new URL('dist/jutsu/browser/', root));
}
