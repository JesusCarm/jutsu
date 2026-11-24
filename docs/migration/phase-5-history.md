> Historical document from before the migration. The paths and commands below describe the Vite version; see the root README for the current Angular application.

# Jutsu Band Builder

A Gipsy Games web application for building three-ninja Jutsu squads and generating their character sheets. Incremental development with vanilla JavaScript, HTML, and CSS, using Vite.

## Status: phase 5

**Generate PDF** takes a copy of the squad data, loads the template and JSON, and generates the complete sheet in memory. The result is a `Uint8Array`; downloading, printing, and template selection remain reserved for phase 6.

The active configuration is **`src/pdf/fichas_rellenables_coordenadas.json`**, alongside the original PDF. Editing guidance, formulas, and class responsibilities are documented in [src/pdf/README.md](src/pdf/README.md).

The supplied coordinate configuration in `src/pdf/` uses a **595.44 × 841.92 pt** reference. It contains 69 fields, of which 54 are printed. The 15 fields without positions remain `enabled: false`: ninja type, separate Mokushin indicators, and separate weapon lists. Weapons and items combine into one inventory line per ninja. Techniques retain Mokushin references in their descriptions. Estimated title, description, and lower inventory boxes were adjusted after reviewing the rendered PDF.

`pdf-lib` is integrated through two independent classes for template loading and document management. The supplied `src/pdf/fichas_rellenables.pdf` template is used. Documents can be inspected, prepared for text insertion, and saved in memory as `Uint8Array`. A two-page auxiliary template remains available for testing pages of different sizes.

The phase 2 form retains the following behavior:

A responsive form builds a squad of exactly three ninjas. Each ninja includes:

- A name and type: Physical, Defensive, Offensive, or Jutsu Master.
- Read-only stats: attack, defense, movement, skill, chakra, and health. The selected type determines these values, displayed beside their labels without input boxes.
- One of twelve groups, containing 36 techniques in total. The group determines exactly three read-only techniques, each with a name, short description, chakra cost, and Mokushin indicator.
- Dropdown selection from three available weapons and four available items. Descriptions and action costs are read-only. Each ninja is limited to **three weapons and two items**.

Changes immediately update a `Band` instance. `src/main.js` creates the squad and game catalog, then passes them to `BandForm`. Models do not depend on the DOM or templates.

Selectors start empty. Before selecting a type, stats are `null` and displayed as “—”. Before selecting a group, no techniques are assigned. Selected stats, techniques, and equipment entries are immutable. Zero remains numeric, and Mokushin remains boolean. Chakra costs also accept text expressions: “1–5”, “1–3”, and “3 + 1/round” are preserved literally.

Changing type replaces its stats; changing group replaces its three techniques. The ninja's name and other selections are retained. Equipment limits apply in both the model and interface. Empty selection rows also occupy one of the three or two slots and can be removed. Data remains in memory while the page is open and resets on reload.

### Game catalog

The four profiles are in `src/data/ninja-types.json`, techniques in `src/data/technique-groups.json`, and weapons/items in `src/data/equipment.json`. Data comes from the supplied values. `src/data/game-data.js` combines these catalogs for `GameCatalog`.

Profile numeric lists follow the confirmed icon order: **attack, defense, movement, skill, chakra, health**. JSON stores each value under its stat name so maintaining data does not depend on list position.

| Type | Attack | Defense | Movement | Skill | Chakra | Health |
| --- | --- | --- | --- | --- | --- | --- |
| Physical | 6 | 5 | 7 | 4 | 12 | 10 |
| Defensive | 4 | 6 | 5 | 5 | 12 | 10 |
| Offensive | 8 | 3 | 7 | 4 | 15 | 10 |
| Jutsu Master | 5 | 4 | 5 | 5 | 20 | 10 |

Selecting a type immediately displays its six values as read-only text. Clearing the selection restores “—”. `GameCatalog` can still return a profile without values if a future definition is missing, without blocking selection or keeping numbers from the previous type.

| List | Definition contents |
| --- | --- |
| `ninjaTypes` | `name` and `stats`, containing all six numeric stats when available. |
| `techniqueGroups` | `name` and `techniques`, containing exactly three definitions with `name`, `description`, numeric/text `chakra`, and boolean `isMokushin`. |
| `weapons` | Text `name`, `description`, and `cost`, such as “1 action”. |
| `items` | Text `name`, `description`, and `cost`. |

Type and group names must match `src/data/ninja-options.js`. Equipment selections use the name as an identifier within their list. Duplicate selections are not prohibited because that rule was not specified.

In the technique file, the supplied `cost` field was stored as `chakra` without changing its contents. `isMokushin` was set for techniques whose descriptions explicitly mention Mokushin, including “Action/Mokushin” uses. Descriptions containing only “Reaction” were not marked as Mokushin. These indicators are stored explicitly in JSON and can be corrected there if rules require an exception.

**Generate PDF** displays generation, success, and error states. Later edits invalidate the previous PDF. If the squad changes during generation, that result is discarded. Reloading loses both squad data and the PDF held in memory.

Vite is the only development dependency. `pdf-lib` manages documents, and `@pdf-lib/fontkit` embeds TrueType fonts with Unicode characters. The generator and its libraries load dynamically when the button is clicked.

The main font is **Eagle Lake**, using the supplied `src/fonts/Eagle_Lake/EagleLake-Regular.ttf` file. Symbols missing from that font, such as → and ≥, use DejaVu Sans only for those characters. Both fonts are served locally, without Google Fonts requests. Licenses are included in `public/licenses/`.

## PDF integration

`BandPdfGenerator.generate(band, template)` returns a promise containing PDF bytes. Data resolution, formatting, fonts, text layout, and writing remain separate classes. The generator does not access the DOM.

```js
import { BandPdfGenerator } from './src/pdf/BandPdfGenerator.js';
import { JutsuPdfTemplate } from './src/pdf/JutsuPdfTemplate.js';

const bytes = await new BandPdfGenerator().generate(band, new JutsuPdfTemplate());
```

This example belongs to a module executed by Vite. `band` is the squad data instance; form controls do not need to be read again.

- `PdfTemplateLoader` fetches a URL, checks the HTTP response, and returns a `PdfDocument`. Tests can replace its request function.
- `PdfDocument` manages a `pdf-lib` document: loading bytes, identifying pages, reading dimensions, preparing a standard font, and saving in memory. It knows nothing about squads, forms, or field configurations.
- `src/pdf/fichas_rellenables.pdf` is the supplied Affinity-exported template. It contains one 595.44 × 841.92 pt page. It is loaded as an existing document while preserving the original file.
- `public/templates/test-template.pdf` is a vector auxiliary template with an A4 page measuring 595.28 × 841.89 pt and an A5 page measuring 419.53 × 595.28 pt. It supports checks for different page sizes and test-text insertion.

Dimensions come from each page's `MediaBox` and use PDF points. Page indexes start at zero. Loading preserves existing metadata, and each load creates an independent document.

| Method | Responsibility |
| --- | --- |
| `PdfTemplateLoader.load(url)` | Fetch and load an existing template. |
| `PdfDocument.fromBytes(bytes)` | Open a PDF from `Uint8Array` or `ArrayBuffer`. |
| `getPageCount()` | Return the number of pages. |
| `getPageInfo(index)` / `getPagesInfo()` | Return indexes, widths, and heights. |
| `getPage(index)` | Access a `pdf-lib` page to prepare content. |
| `prepareForText()` | Embed standard Helvetica once and return its font. |
| `save()` | Serialize the modified document as `Uint8Array` without downloading it. |

`prepareForText()` retains Helvetica for isolated document-module tests. Sheet generation uses `PdfFontProvider` and Eagle Lake. Loading, page access, saving, and font embedding follow the [official PDFDocument API](https://pdf-lib.js.org/docs/api/classes/pdfdocument); dimensions come from [PDFPage.getSize](https://pdf-lib.js.org/docs/api/classes/pdfpage#getsize).

### Browser checks during development

Start Vite with `npm run dev`, open the application, and run this example in the browser console. It independently checks the document module and directly uses the supplied file path served by Vite during development.

```js
const { PdfTemplateLoader } = await import('/src/pdf/PdfTemplateLoader.js');
const testPdf = await new PdfTemplateLoader().load('/src/pdf/fichas_rellenables.pdf');
console.table(testPdf.getPagesInfo());

await testPdf.prepareForText();
const pdfBytes = await testPdf.save();
console.log(pdfBytes instanceof Uint8Array, pdfBytes.length);
```

The result remains in `pdfBytes` in memory, preserving the source template. This example checks only the document module; the interface button runs the complete generator. `JutsuPdfTemplate` uses asset URLs transformed by Vite for development and production, without relying on `/src/` paths in compiled output.

## Local development

Requires a Node.js version compatible with the installed Vite version and npm. The project was verified using Node.js **22.22.1**.

```sh
npm install
npm run dev
```

Open the local URL reported by Vite in the terminal, usually `http://localhost:5173`.

## Production build

```sh
npm run build
```

Static files are generated in `dist/`. To check the build locally:

```sh
npm run preview
```

Hosting and the final path or subdomain will be configured later. This phase does not publish the application or modify Ghost.

## Structure

```text
index.html          Main page and accessible structure
public/
  templates/
    test-template.pdf Two-page test template (A4 and A5)
src/
  main.js           Creates Band and GameCatalog and mounts BandForm (ES Modules)
  data/
    ninja-options.js Known types, groups, and stats
    game-data.js    Combines the game catalogs
    ninja-types.json Four types and their stats
    technique-groups.json Twelve groups and their 36 techniques
    equipment.json Weapons, items, and their action costs
  models/
    Band.js         Three-ninja squad
    Ninja.js        One ninja's data and composition
    NinjaStats.js   Ninja stats
    TechniqueGroup.js Group selection and its three techniques
    Technique.js    Immutable technique data
    Equipment.js    Equipment lists and add/remove operations
    EquipmentEntry.js Immutable name, description, and cost of a weapon/item
    GameCatalog.js  Access to available definitions
  pdf/
    PdfTemplateLoader.js Loading PDF templates by URL
    PdfDocument.js  Pages, text resources, and saving in memory
    BandPdfGenerator.js Coordinates generation from data
    BandFieldResolver.js Reads squad data paths
    PdfFieldFormatter.js Converts values to text
    PdfFontProvider.js Loads and embeds fonts
    PdfFontFamily.js Selects glyphs and measures text
    PdfTextLayout.js Fits lines and font sizes within boxes
    PdfFieldRenderer.js Writes vector text onto the page
    JutsuPdfTemplate.js Configuration, PDF, and font URLs
    PdfTemplateConfig.js Validates and queries configuration
    PdfTemplateConfigLoader.js Reads JSON and retains its source URL
    AffinityCoordinateConverter.js Converts units and coordinate origins
    fichas_rellenables.pdf Supplied single-page template
    fichas_rellenables_coordenadas.json Active field configuration
    README.md       Configuration and generation guide
  fonts/
    Eagle_Lake/     Supplied main font and license
    DejaVu_Sans/    Fallback font for missing symbols
  ui/
    BandForm.js     Mounts the form and coordinates ninja editors
    NinjaEditor.js  Composes one ninja's editor
    StatsView.js    Displays read-only stats
    TechniqueGroupEditor.js Group selector and technique composition
    TechniqueView.js Displays one read-only technique
    EquipmentListEditor.js Edits a weapon/item list
    EquipmentEntryEditor.js Edits an equipment entry
    FormField.js    Labeled control and value conversion
    ReadOnlyField.js Displays a read-only value
    PdfGenerationController.js Button state and PDF in memory
    dom.js          Small node and fieldset creation helpers
  styles.css        Styles and responsive layout
tests/
  models.test.js    Model tests without a browser
  catalog.test.js   Real data selection, stats, and costs
  pdf.test.js       PDF loading, pages, preparation, saving, and errors
  template-config.test.js Configuration, field binding, and coordinates
  pdf-generation.test.js Generation with twelve groups, fonts, and data
  fixtures/
    game-data.js    Synthetic data used only by tests
package.json        Vite configuration and commands
package-lock.json   Resolved dependency versions
.gitignore          Excludes dependencies and build output
```

Downloading and printing will be added when phase 6 is authorized.

## Architecture principles

Development follows object-oriented design, with one class per file and one responsibility per class. Objects are composed: a squad contains ninjas; each ninja contains stats, a technique group, and equipment. The interface receives these objects and delegates each section to its editor. Composition is used without introducing a base-class hierarchy.

- `models/` contains state and data operations. `Ninja.selectType(definition)` assigns a type and its available stats; `TechniqueGroup.selectGroup(definition)` assigns three techniques. `Equipment` manages slots, limits, and selections through `addEntry(kind)`, `selectEntry(kind, index, definition)`, and `removeEntry(kind, index)`. Classes work without a browser.
- `ui/` handles editing and presentation. `EquipmentListEditor` invokes `Equipment` operations; `EquipmentEntryEditor` displays an entry's dropdown and description. `StatsView` and `TechniqueView` display derived data without editable controls.
- `FormField` manages editable controls; `ReadOnlyField` displays label/value pairs without editing.
- `data/ninja-options.js` contains known names. JSON files contain catalogs. `data/game-data.js` combines them for `GameCatalog`.
- `main.js` only creates and connects application objects.
- `pdf/` handles documents and templates independently of game models and the interface. Template fetching and document management belong to separate classes.
- `BandFieldResolver` reads model paths; `PdfFieldFormatter` formats values. `PdfFontProvider` obtains fonts; `PdfFontFamily` resolves glyphs and metrics. `PdfTextLayout` computes lines and positions; `PdfFieldRenderer` writes text. `BandPdfGenerator` coordinates these tasks.
- `PdfGenerationController` connects the button to the generator and retains the latest valid PDF. Interface state belongs to neither models nor the generator.

Profiles are maintained in `ninja-types.json`, techniques in `technique-groups.json`, and weapons/items in `equipment.json`. Presentation changes belong in the appropriate view or editor. Limits are changed in `Equipment.getLimit(kind)`. Later changes should preserve this separation.

Instances retain the earlier data structure and can be converted to JSON with `JSON.stringify(band)`.

## Tests

```sh
npm test
```

Tests use Node.js's built-in runner without additional testing libraries. They check derived profiles, immutable techniques, selection changes, equipment limits, independent data, and JSON structure. PDF tests load the supplied and auxiliary templates, verify page dimensions, prepare text, save/reopen bytes, and cover HTTP errors and invalid files. Node file APIs are used only in tests; application modules use `fetch` and `pdf-lib`.

Synthetic values in `tests/fixtures/` are not Jutsu rules and are not imported by the application. The build is checked with `npm run build`.

Configuration tests verify all 69 field paths against the model, pending-data detection, per-field styles, and relative PDF URL resolution. Conversion tests cover pixel and point references, per-axis scaling, nonzero PDF origins, Y-axis inversion, and invalid-box rejection.

Generation tests use all twelve real technique groups, variable costs, Unicode symbols, combined inventories, and a data snapshot taken before requests. They verify that the squad and original template are unchanged. Text that cannot fit at the configured minimum size reports the affected field instead of being silently truncated.
