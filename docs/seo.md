# SEO and indexing

## Public pages

The canonical English page is `https://jutsu.gipsygames.com/`; the Spanish page is `https://jutsu.gipsygames.com/es/`. Each page has a self-referencing canonical URL, reciprocal `en` and `es` alternatives, and an `x-default` alternative pointing to English. Query parameters and fragments are excluded from canonical and social URLs.

`src/app/core/seo/site-config.json` is the source for the production URL, language paths, Open Graph locales, and sharing image. Update it when moving the public site. The default English metadata and introductory content in `src/index.html` also serve development; keep them aligned with `public/i18n/en.json`. `SeoService` updates metadata during client navigation.

The visible H1 and introduction explain that the tool builds a squad of three ninjas and exports printable PDF character sheets. The English reference and Spanish copy live in the translation dictionaries. The Spanish editor still uses the established English fallback for untranslated game text.

## Production output and hosting

Run `npm run build` from the repository root. Its postbuild step runs `scripts/write-seo-pages.mjs` after Angular compilation and emits:

- `index.html`: English initial content, canonical URL, and social metadata.
- `es/index.html`: Spanish initial content, canonical URL, and social metadata.
- `robots.txt`: crawler access and the absolute sitemap URL.
- `sitemap.xml`: the two canonical page URLs.

Both initial HTML entries contain a real heading, introduction, and language links before JavaScript runs. The editor and PDF generation still require JavaScript. This is a localized static introduction, not server rendering of the entire editor. Sharing uses the existing 512 × 512 Jutsu logo and a Twitter summary card.

Publish the complete `dist/jutsu/browser/` directory. The application Nginx configuration serves `/es/` from its localized entry, redirects `/es` to `/es/`, and serves the same Spanish HTML for legacy `/?lang=es` links. The latter advertise `/es/` as canonical. `robots.txt` and `sitemap.xml` have explicit file locations and real 404 responses if missing, rather than falling through to the Angular app. Their content types are `text/plain` and `application/xml`.

Other static hosts must serve `es/index.html` for `/es/` before applying the SPA fallback. The Angular development server is for editor development and does not run the production postbuild step; use the built container for crawl and social preview checks. For a different public origin or a subdirectory deployment, update the public URL in `site-config.json`, set the Angular base href, and adapt the Nginx locations to that prefix.

## Verification

Run `npm run typecheck`, `npm test`, `npm run build`, and, when Docker is available, `npm run test:docker`. Automated checks cover localized initial HTML without JavaScript, metadata updates, valid sitemap XML, language navigation, query/fragment preservation, and editor instance/data preservation. Container checks verify the localized responses, legacy link, discovery files, and content types. The deployment workflow also checks these responses before deploying the image.

After deployment, inspect the actual public responses:

```bash
curl -i https://jutsu.gipsygames.com/robots.txt
curl -i https://jutsu.gipsygames.com/sitemap.xml
curl -s https://jutsu.gipsygames.com/es/
```

Verify both canonical URLs in the site's Google Search Console property. Use URL Inspection and its live test, check the selected canonical and any indexing restrictions, submit `https://jutsu.gipsygames.com/sitemap.xml`, and request indexing for the two pages. These steps require access to the verified property. A successful local build or an empty `site:` search cannot confirm Google's indexing state.

## References

- [Google: managing multilingual sites](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Google: localized page alternatives](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: URL Inspection](https://support.google.com/webmasters/answer/9012289)
