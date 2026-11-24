# Angular migration — phase 5

Date: November 22, 2026. Working branch: `migration/angular-modern`.

## Inventory before changes

The application used JavaScript ES Modules with Vite 8.3.8, without TypeScript or Angular. It had one screen built through DOM manipulation. `Band`, `Ninja`, `NinjaStats`, `TechniqueGroup`, `Technique`, `Equipment`, `EquipmentEntry`, and `GameCatalog` contained the rules. Three JSON files supplied four types, twelve groups of three techniques, three weapons, and four items.

The form supported editing names, selecting types and groups, viewing derived stats, and adding/removing up to three weapons and two items per ninja. List editing preserved focus. There were no required fields, navigation between screens, persistence, or backend.

The phase 5 PDF flow took a JSON snapshot, loaded the template and coordinates, composed text using Eagle Lake and DejaVu Sans, and retained a `Uint8Array` in memory. Results were discarded if the squad changed during generation. Downloading, printing, and template selection were explicitly reserved for phase 6.

The inventory identified the original template, its 69-field coordinate JSON (54 active and 15 disabled), two local fonts, licenses, and a two-page auxiliary template. The original tests covered 40 model, catalog, PDF, and coordinate cases and passed before editing. The repository contained staged and untracked files but **no commits**.

## Decisions and resulting structure

- Generated the base with official Angular CLI 21.2.30, standalone components, routing, SCSS, and strict mode. Configuration was integrated into the existing repository.
- Angular 21.2.26 supports the installed Node 22.22.1. Angular 22.3.0, the stable release checked at the time, requires at least Node 22.22.3 in that series. Material/CDK use the latest compatible series 21 patch verified during migration, 21.2.14.
- Official `@angular/build:application` builder with esbuild; CLI-managed Vite for development. No SSR, prerendering, AnalogJS, or custom Vite configuration.
- Standalone `OnPush` components, `inject()`, `input()`, `output()`, and `@for`; `linkedSignal()` synchronizes editable controls with their inputs. No component two-way bindings through `model()` or additional `@defer` blocks are needed.
- `core/models/` preserves the classes and rules, now typed. `core/services/` contains the catalog and local URL resolution.
- `features/character-sheet/` contains `BandState`, the editor, and small identity, stats, technique, and equipment components. State uses Signals with `computed()` derived views.
- `features/pdf-generator/` contains the pure engine, its types, the coordination service, and the visible generation action. PDF dependencies load when generation is requested.
- `layout/` preserves the header and footer. The router lazily loads the single real screen and redirects unknown routes to the editor.
- `src/assets/` groups original catalogs, PDF, coordinates, and fonts. The auxiliary template and public licenses are retained.
- Material 3 provides a configurable theme and device-dependent light/dark colors. Native selectors within Material fields preserve touch interaction and accessibility. CDK restores focus after additions and removals. SCSS starts with one column and expands from 40 rem.
- No Zone.js, following Angular 21 defaults.
- **Typed Reactive Forms**: the installed `@angular/forms/signals` API declares itself experimental (`@experimental 21.0.0` in its declarations). The requested stability takes priority; no template-driven forms are introduced. RxJS remains only as a dependency required by Angular and Material.

Official references: [versions](https://angular.dev/reference/versions), [Signal Forms v21](https://v21.angular.dev/api/forms/signals/form), [zoneless](https://angular.dev/guide/zoneless), [style](https://angular.dev/style-guide).

## Preserving behavior and assets

Coordinate conversion, text fitting, line wrapping, metrics, glyph selection, formatting, and composition algorithms are preserved. Engine changes are TypeScript types, module names/paths, and asset resolution. Test inputs convert Node Buffers to Uint8Array to avoid jsdom realm differences; this does not change production algorithms.

Byte-for-byte equality was verified between the initial files and relocated assets: three catalogs, template, coordinates, fonts, licenses, and auxiliary PDF. Coordinates were not rounded, and pending fields were not activated.

`tests/fixtures/phase5-render-operations.json` was captured from the original engine before its removal. The equivalence test compares 216 operations from four squads covering all twelve groups: text, boxes, styles, font sizes, line breaks, and final positions. This reference is not regenerated automatically when tests run.

The review PDF is at `output/pdf/angular-migration-preview.pdf`. It was rendered with Poppler at 1500 pixels and inspected visually. Its image is pixel-identical to the rendering produced before migration: SHA-256 `9903355f1ef79fdd3df8d750735234fedc3d9d4242a9fd81f2477cecb5b66afc` for both images.

The previous README remains in `phase-5-history.md`, and a complete copy of the original source is retained at `output/migration/vite-phase5-source.tar.gz`, excluding node_modules, dist, and Git metadata. At migration completion, the prior Git index was preserved; no commits or merge were created.

For the subsequently authorized upload to `JesusCarm/jutsu`, the initial remote commit is retained as the base of `migration/angular-modern`. A commit containing the Angular application and updated `.gitignore` is prepared. Review outputs and the original-source backup are excluded from the repository and remain local. Required PDF templates and fonts are versioned. A copy of the index before publication is also retained outside the repository.

## Checks

| Check | Result |
| --- | --- |
| Lockfile installation (`npm ci`) | Passed with npm 9.2.0 after resolving test package versions. |
| Production (`npm run build`) | Passed; static output in `dist/jutsu/browser/`. |
| TypeScript (`npm run typecheck`) | Passed in strict mode. The build also checks Angular templates. |
| Tests (`npm test`) | All 49 cases in 10 files passed. |
| Server and assets | `ng serve` starts successfully; HTTP 200 for the page and all seven PDF/catalog/font assets, identical to their sources and production copies. |
| Navigation | Lazy editor loading and unknown-route redirection verified with RouterTestingHarness. |
| Forms | TestBed/jsdom DOM interactions: three ninjas, names, selections, clearing, derived data, equipment, and focus. |
| PDF generation | Real templates, twelve groups, Unicode, fonts, reopened documents, original-engine equivalence, and stale-result rejection. |
| Downloading | Absent in phase 5; left pending rather than implemented during migration. |
| Visual desktop/mobile browser review | Pending: the browser access host was unavailable. |

The initial installation encountered an internal npm failure (`edgesOut`) when resolving optional versions with open Vitest ranges. Pinning Vitest 4.0.18 and jsdom 28.0.0 allowed npm 9.2.0 to install successfully without forcing peers or using `--legacy-peer-deps`.

## Pending manual review

1. Run `npm run dev` and review desktop, tablet, and mobile layouts, including a 320-pixel viewport.
2. Check light/dark themes against device preferences and verify contrast for fields, buttons, and readonly values.
3. Review touch selectors, keyboard navigation, focus after additions/removals, and generation status announcements.
4. Open the review PDF and confirm its appearance in the usual viewer and printer. At this migration stage, the application still has no download or print buttons.
5. Approve this migration before beginning any phase 6 functionality.

## Deliberate limits

No game-session features, downloading, printing, persistence, IndexedDB, authentication, backend, AI, Capacitor, Service Worker, or PWA caching are added during migration. Future integrations can reuse the PDF engine and adapt `PlatformAssets`; the architecture does not depend on a remote service. Reloading still clears the squad, as in the previous application.
