# Jutsu Band Builder

A local Gipsy Games application for building a squad of **three ninjas** and generating their character sheets. Migrated from JavaScript/Vite to Angular and implemented through **phase 6**: PDF generation, downloads named after the squad, and opening PDFs for printing. Everything runs in the browser.

## Environment and dependencies

- Node.js `^20.19.0`, `^22.12.0`, or `>=24.0.0`; migration verified with **22.22.1** and npm **9.2.0**.
- Angular **21.2.26**, CLI and application builder `@angular/build` **21.2.30**.
- Angular Material and CDK **21.2.14**, with a Material 3 theme and customizable colors in `src/styles.scss`.
- TypeScript **5.9.3**, strict mode and strict templates.
- Vitest **4.0.18** and jsdom **28.0.0** through the official Angular CLI test runner.
- Existing `pdf-lib` **1.17.1** and `@pdf-lib/fontkit` **1.1.1** dependencies.

Angular 21.2 was the latest stable series verified as compatible with the installed Node version during migration. Angular 22.3 requires Node `^22.22.3 || ^24.15.0 || >=26.0.0`; the system environment was not upgraded to force that transition. Angular, CLI, and Material publish patches independently, so their version numbers differ. The lockfile pins the installed versions.

References: [Angular compatibility](https://angular.dev/reference/versions), [style guide](https://angular.dev/style-guide), [Signals](https://angular.dev/guide/signals), [zoneless](https://angular.dev/guide/zoneless), [Angular Material](https://material.angular.dev/).

## Installation and development

```bash
npm ci
npm run dev
```

Open `http://localhost:4200`. `npm start` is equivalent. The development server uses Vite managed by Angular CLI; production builds use the official `@angular/build:application` builder, based on esbuild. There is no custom Vite configuration.

## Production build

```bash
npm run build
```

Static output: **`dist/jutsu/browser/`**. Publish its contents on a static host that redirects application routes to `index.html`. For a subdirectory, such as `/jutsu/`:

```bash
npm run build -- --base-href /jutsu/
```

`npm run preview` serves a production build through Angular CLI. The application has not been published, and no application server has been configured.

## Tests

```bash
npm test
npm run typecheck
```

`npm run test:watch` keeps tests running in watch mode. `ng test` uses Vitest through the official runner, without custom configuration. The original JavaScript tests remain, adapted to Vitest and the new paths; their invalid-input cases still check runtime validation. All application code uses strict TypeScript.

Tests cover the catalog, models, equipment limits, ninja isolation, selections and clearing values, keyboard focus, navigation, asynchronous generation, errors, stale-result rejection, fonts, Unicode, coordinates, and PDF composition. They also check filenames, template selection, export buttons, Blob downloads, blocked windows, and URL cleanup. Editor tests check synchronized mini sheets, stats and icons, equipment slots selected out of order, and switching characters without recreating forms or invalidating the PDF. AcroForm tests reopen each card, verify its fifteen values and appearances, clear previous data, and cover all twelve technique groups. Static exports verify three independent vector cards on A4 without form borders or notes, with separate costs and conditional Mokushin icons. A historical rendering reference preserves coordinate-engine equivalence using the original catalog fixture and canvas dimensions.

## Architecture

```text
src/
  app/
    core/
      models/               # Existing squad model and rules, independent of Angular
      services/             # JSON catalog and platform asset URLs
      i18n/                 # Signals service, generated typed keys, and game text
    features/
      character-sheet/      # Editor, Signals state, and components in subdirectories
      pdf-generator/        # PDF engine, templates, generation, and local export
    layout/                 # Application structure and footer
    shared/                 # SVG icons and typed local assets
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts
    app.routes.ts
  assets/
    data/                   # Language-neutral game catalogs and numeric rules
    fonts/                  # Eagle Lake, DejaVu Sans, and licenses
    icons/                  # _ico SVG files for stats, equipment, and Mokushin
    pdf/                    # PDF form and legacy coordinate configuration
  index.html
  main.ts
  styles.scss
public/
  i18n/                     # English reference and partial Spanish dictionary
  licenses/
  templates/test-template.pdf
tests/                     # Original tests and historical equivalence fixtures
docs/migration/             # Inventory, decisions, and verification report
```

Components are standalone and use `OnPush`, `inject()`, Signal inputs/outputs, and `@for` control flow. There are no application NgModules. Angular 21 runs **without Zone.js** by default; Zone.js is neither installed nor loaded.

Each component has its own directory, a class ending in `Component`, and separate files. For example:

```text
features/character-sheet/ninja-editor/
  ninja-editor.component.ts
  ninja-editor.component.html
  ninja-editor.component.scss
```

Injectable services use `.service.ts` files and classes ending in `Service`; tests retain the corresponding suffix, such as `.component.spec.ts` or `.service.spec.ts`. Templates use `templateUrl` and styles use `styleUrl`. Component-specific styles live in the component's SCSS; `src/styles.scss` contains the theme, shared controls, and global utilities. Independent domain and PDF engine classes keep ordinary TypeScript names.

These conventions are recorded in [AGENTS.md](AGENTS.md) and the `angular.json` schematics: components in directories, external HTML/SCSS, and `.component`, `.service`, `.directive`, `.pipe`, `.guard`, `.resolver`, `.interceptor`, and `.module` suffixes. New applications use `fileNameStyleGuide: "2016"`. These eight generators and the application generator were checked with `--dry-run`.

`BandStateService` preserves model rules and exposes typed snapshots through readonly Signals and `computed()`. Editable controls use **typed Reactive Forms**: Angular 21 Signal Forms still marks its API experimental, so it does not meet the migration's stability requirement. There are no template-driven forms or RxJS-based synchronous state. Controls keep their `FormControl` instances and synchronize external changes through `effect()`, preserving focus and cursor position while editing.

There is one application screen. Angular Router loads it lazily and redirects unknown routes to the editor. No placeholder screens or directories for future features are added. The PDF engine and its dependencies load when generation is first requested; no `@defer` block delays a form that must be available immediately.

The presentation follows the dark editor references: a compact header, squad bar, and three mini sheets. Names are edited in place with Reactive Forms. Type, weapon, item, and school buttons open four right-side selection panels with localized labels, previews, and descriptions. Panels use the installed Angular CDK Dialog and Overlay packages over the Material theme.

Below **56 rem**, the three mini sheets stack vertically at full width above the selected character's descriptions; “View details” chooses that character. At and above that width, three columns each display a mini sheet and its descriptions. Clicking a desktop card does not select it, while its name input and selection buttons remain available. Names, type, equipment, and school are edited directly from the mini sheet. Each editor retains a single instance: switching characters or viewport size does not clear selections. Mobile detail selection is interface state and does not invalidate the generated PDF. See [the selection-panel guide](docs/selection-panels.md) for component responsibilities, accessibility, and printing.

`NinjaSummaryComponent`, `StatsViewComponent`, and `EquipmentSummaryComponent` present summaries; editing actions go through `NinjaSelectionService` and `BandStateService`. `EquipmentPresentation` shares the icon and slot mapping between mini sheets and choice panels; `NinjaTypePresentation` maps type IDs to icons in the summaries and type picker. `UiIconComponent`, in `shared/ui-icon/ui-icon.component.ts`, centralizes the supplied SVG assets in `src/assets/icons/`. SVGs cover all six stats, ninja types, weapons, items, the jutsu school, equipment categories, and Mokushin. Inline drawings remain for utility actions and empty slots. `mokushin_ico.svg` is shared with PDF generation. `objetivo_ico.svg` is registered as `target`, available for assignment once its use is defined. URLs respect `<base href>`, and icons appear at **20 × 20 px**, without circular cropping. Black SVGs are displayed in a light color through CSS for contrast with the dark background; flags retain their colors. To replace another icon, register its asset in that component; catalog data and rules need no changes. All six stats include movement and remain read-only. Weapon and item details are available under “View equipment effects.”

## Current features

- An optional squad name used to identify the downloaded file.
- Three independent ninjas, each with a name and one of four types.
- Read-only stats derived from the selected type, including zero values.
- Twelve groups of three techniques, descriptions, fixed or variable chakra costs, and Mokushin icons in the editor and PDF.
- Three weapon slots and two item slots per ninja, with data derived from the catalog. “No weapon” and “No item” clear a slot without shifting the others.
- Mini sheets with icons for all six stats and selected equipment, synchronized with their character.
- PDF generation from a squad snapshot, loading/success/error states, and invalidation after editing.
- A single-ninja template with fifteen named fields and three Mokushin marker notes; generation of three independent cards on one A4 page without form boxes or editing highlights.
- Eagle Lake with DejaVu Sans fallback, locally embedded fonts, and text fitted to each field. The legacy coordinate engine remains available for other templates.
- A selector offering the current three-ninja-per-page template; only available templates are listed.
- PDF download and opening in another tab for printing through the browser's PDF viewer.

No new required fields or name restrictions have been added. The model still rejects unknown types and groups, invalid indexes, malformed data, and excess equipment.

## PDF generation and local operation

The engine in `features/pdf-generator/` does not depend on Angular or the DOM. It receives data, a template, and a resource loader that tests can replace. The current template contains one card with `Ninja1_…` fields; `JutsuFormFields` maps those names to data and styles. Each ninja fills an independent copy, which is flattened before all three are composed on an A4 page. Positions come from the PDF without loading the coordinate JSON. Each technique includes a name and description; chakra goes in its `_cost` field. Notes containing `Ninja1_technique_1_mokushin` and the corresponding identifiers for techniques 2 and 3 mark the boxes where the SVG is drawn when applicable. Matching ignores letter case. Marker notes are removed, and inventory combines weapons and items. Vector flattening preserves the design and sharpness. The downloaded PDF has no editable fields; the source template remains fillable and unchanged.

`PdfGenerationService` connects the engine to the form and keeps valid bytes in memory. `getPdfBytes()` returns a copy, or `null` if the squad, language, or template changed. [PDF engine and export documentation](src/app/features/pdf-generator/README.md).

1. Enter a **Squad** name to customize the filename and complete the ninjas. Edit ninja names directly, and use the mini-sheet buttons for type, school, weapons, and items. On mobile, use View details to choose the descriptions below.
2. Choose a **Sheet template**. For now, only the original Eagle Lake template is available.
3. Click **Generate and download PDF** in the toolbar or below the editor. Once generation finishes, download starts automatically and the filename appears. For example, `The Ravens` produces `jutsu-squad-The-Ravens.pdf`; an empty name uses `jutsu-squad.pdf`. Unsupported filename characters are replaced, and long names are limited.
4. **Open PDF for printing** is available immediately and generates a fresh document before loading it into a reserved tab. Use the PDF viewer's print controls. If the browser blocks the tab, the status asks you to allow pop-ups for this site and retry. Icons have accessible labels and display their actions on hover.

Any edit, including the squad name, or a language/template change invalidates the generated PDF. Generate/download and print actions produce a new PDF from the current data. A generation that becomes stale is discarded. Already-open PDFs keep their resources until their tabs close; temporary download URLs are released after download starts, and all resources are cleaned up when the application is destroyed.

The template, coordinates, fonts, and catalogs are copied as application assets. `PlatformAssetsService` centralizes URL resolution against `<base href>`, supporting static navigation and future platform adaptations. There is no backend, authentication, remote API, runtime AI, or cloud storage. The earlier version did not persist squads: reloading still clears the data, and no storage is migrated or introduced.

Future PWA or Capacitor support can reuse the engine and adapt platform access. **Capacitor, Service Worker, and offline caching are not installed in this phase.**

## Migration review

See [the migration report](docs/migration/angular-migration.md) for that phase's inventory and checks. [The previous README](docs/migration/phase-5-history.md) remains as a historical document. The migration is already integrated into `main` in [JesusCarm/jutsu](https://github.com/JesusCarm/jutsu).

`.gitignore` excludes dependencies, builds, caches, coverage, generated output, review copies, and local configuration. PDF templates, fonts, licenses, catalogs, and `package-lock.json` are versioned. The initial `output/migration/vite-phase5-source.tar.gz` backup and review PDFs remain local.

Current verification includes automated tests, type checking, and the production build pass. Three-card sheets covering all twelve technique groups, including Unicode symbols, have been rendered and reviewed. Tests check costs, marker notes, cleanup, conditional icons, A4 composition, ninja isolation, and resource errors. All ten `_ico` SVG files are copied unchanged to production. The user confirmed phase 6 downloads in Firefox at `http://localhost:4200/` after resolving a `start` error that had kept an older build running. HTTP checks confirm that the server delivers the editor with mini sheets and export actions. Visual browser review of the desktop/mobile editor and manually opening the print flow remain pending because the browser access host was unavailable during implementation.

## Internationalization

Use the header flags or `?lang=en` / `?lang=es`. English is complete; Spanish contains only review samples and falls back to English per key. Switching language preserves form data and updates the URL without reloading. The PDF uses the same active dictionary; changing language invalidates the previous export. No translation dependencies or browser persistence were added.

Edit `public/i18n/en.json` and run `npm run i18n:generate` for typed autocomplete constants. Game catalogs now contain stable IDs and numeric rule parameters. See [the i18n guide](docs/i18n.md) for the data model, adding locales, deployment under a subpath, and the PDF boundary.
