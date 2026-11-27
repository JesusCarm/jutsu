# PDF templates and generation

The default template is the **single-ninja** form `src/assets/pdf/fichas_rellenables.pdf`. The generator fills it three times, once per character, and composes all three cards on one static A4 page without form borders or backgrounds. Positions and dimensions come from PDF fields and notes; no coordinate JSON is loaded. The source template remains fillable and unchanged.

`JutsuPdfTemplate` receives the local asset base URL and supplies the `JutsuFormFields` mapping. Angular CLI copies `src/assets/` to `assets/` without modifying files. `PlatformAssetsService` resolves that base against the application's `<base href>`, including deployment under a subdirectory.

## Reference and fields

The form has **15 text fields** on one **595.44 × 288 pt** page. All use the `Ninja1_` prefix: each copy receives a different ninja before flattening. The mapping preserves the original PDF field names:

| Field suffix | Ninja property |
| --- | --- |
| `name` | `name` |
| `technique_group` | `techniqueGroup.name` |
| `stats_attack` | `stats.attack` |
| `stats_defense` | `stats.defense` |
| `stats_movement` | `stats.movement` |
| `stats_hability` | `stats.skill` |
| `stats_chakra` | `stats.chakra` |
| `stats_life` | `stats.health` |
| `technique_1`, `technique_2`, `technique_3` | The three entries in `techniqueGroup.techniques` |
| `technique_1_cost`, `technique_2_cost`, `technique_3_cost` | Each technique's `chakra` value |
| `items_and_weapons` | `equipment.weapons` and `equipment.items` |

For example, `Ninja1_items_and_weapons` combines the equipment of the character currently being filled. The confirmed icon order is **attack, defense, movement, skill, chakra, health**. Ninja type has no separate field in this template.

Values are displayed according to these rules:

- Numbers preserve zero. Unselected data clears the field, including any previous template value.
- Each technique occupies a multiline field containing its name and description. Mokushin references that form part of the rules are preserved.
- The cost is written separately in its `_cost` field, next to the chakra icon already included in the artwork. It accepts numbers and text: `0`, `5`, `1–3`, `1–5`, and `3 + 1/round`. It is not repeated in the technique body.
- Inventory contains weapon and item names separated by commas, omitting empty slots.
- Other fields use a single line.

The generator validates that expected fields exist, are text fields, and have widgets attached to pages and linked to their canonical fields. It rejects duplicate names and orphan widgets. Both the canonical `/V` value and each widget's `/AP` appearance are updated.

`JutsuPdfTemplate.formOutput` is `flattened`: form borders and backgrounds are omitted, appearances become page content, and widgets and the AcroForm tree are removed. The viewer can no longer display or highlight editable boxes. Decorative frames from the original design remain. Text stays vector-based without converting the page into an image; character changes are made in the application before regenerating.

The engine also supports an individual editable card with `repeatedSheet: undefined` and `formOutput: 'editable'`. Templates without `formOutput` retain editable behavior. Multiple-card composition requires `flattened` so fields cannot share values. Tests reopen both outputs: they compare the fifteen canonical and inherited values on each editable card and verify three independent cards with fifteen appearances each on static A4 output, without borders, widgets, or a form tree. They also check that the source template is unchanged.

## Mokushin markers

Each icon position is defined by a PDF note annotation (`/Text`) whose **contents** are one of these identifiers:

```text
Ninja1_technique_1_mokushin
Ninja1_technique_2_mokushin
Ninja1_technique_3_mokushin
```

Leading/trailing whitespace and letter case are ignored; the current template mixes `mokushin` and `Mokushin`. `PdfNoteMarkers` reads `/Rect`, validates that each marker occurs exactly once with positive dimensions, and removes the note and any associated pop-ups. Layers and bookmarks are not used.

When `isMokushin` is true, `PdfNoteIconRenderer` centers `mokushin_ico.svg` in that rectangle, preserving its aspect ratio. Otherwise, the space remains empty. The template does not need a fixed Mokushin image, and generated PDFs do not display note icons. Marker or resource errors identify the affected marker and ninja.

The icon is loaded from `JutsuPdfTemplate.iconUrls` and embedded once per card, only when a technique uses it. `PdfSvgIcon` preserves the Affinity SVG's monochrome paths, matrix-transformed groups, and fill rule as vectors, omitting its transparent reference rectangle. For the grid icons, it also retains path strokes and embedded PNG details referenced by local `use` elements. It rejects unsupported elements, transforms, and external image references to avoid partial conversion. It requires no DOM, canvas, or external dependencies.

## Page composition

`JutsuPdfTemplate.repeatedSheet` declares three copies on A4 (**595.28 × 841.89 pt**). `BandSheetPdfGenerator` takes the snapshot's three ninjas and fills an independent form copy for each, always using the `Ninja1_` field names. The template, fonts, and SVG are fetched once per generation, although each card has its own document and values.

Each copy is flattened before being added to the final page. `PdfSheetComposer` divides the page into three equal vertical slots, scales each card proportionally, and centers it within its slot. Top-to-bottom order matches the editor. Text and artwork are embedded as vector resources; the cards are not rasterized.

A template containing more than one page, an unexpected number of ninjas, or editable output mode produces an error instead of partial composition.

## Typography

The main font is **Eagle Lake**, loaded locally from `src/assets/fonts/Eagle_Lake/`. Missing symbols use **DejaVu Sans**. The fallback applies only to characters absent from the main font, such as → and ≥.

`JutsuFormFields` defines typography per field. Names start at 14 pt, stats at 11 pt, and other text at 9 pt. Techniques align at the top; stats and costs are centered. Costs can shrink to 4 pt to preserve the full `3 + 1/round` value in the template's narrow box. Widening that PDF field improves readability. A4 composition then scales each card uniformly. A `typography` style supports these properties:

| Property | Purpose |
| --- | --- |
| `font` | Main font name registered in `JutsuPdfTemplate.fontUrls`. |
| `fallbackFonts` | Fallback fonts for missing glyphs. |
| `fontSize` | Initial text size. |
| `minFontSize` | Minimum permitted size when fitting content. |
| `fontSizeUnit` | `pt` for PDF points, or `px` when the page reference also uses pixels. |
| `lineHeight` | Line spacing; `null` uses line metrics. Scales proportionally when text shrinks. |
| `alignment` | `left`, `center`, or `right`. |
| `verticalAlignment` | `top`, `middle`, or `bottom`. |
| `color` | `#RRGGBB` color. |

The layout engine measures glyphs, wraps lines, and shrinks text within field bounds while retaining inner padding. It accounts for accents, descenders, and side bearings. Content is not truncated: generation identifies the affected field if the text cannot fit at the minimum size. Editable output preserves field borders and backgrounds; static output omits them without moving the text. The current template has no rotated widgets; those are rejected with an explicit error.

Fonts are embedded with `@pdf-lib/fontkit`: static output includes used glyphs; editable output includes complete fonts for later changes. Appearances can combine both fonts on one line. Neither the template nor its text is rasterized. Font files and licenses are included locally; Google Fonts link tags are not required for PDF generation.

## Coordinate compatibility

Templates without `formFields` or `repeatedSheet` still use the original coordinate engine. `fichas_rellenables_coordenadas.json` remains as a reference for the previous three-ninja template, with 69 declared fields and 54 active fields. The fifteen pending fields remain disabled, and review metadata is preserved. That JSON does not match the active individual form's dimensions. The legacy equivalence test uses the original catalog fixture and canvas dimensions, independent of current game rules and artwork.

In that mode, `configUrl` points to the JSON, and its `pdf` property resolves relative to that URL. Paths such as `ninjas.0.name` identify data. `sources` combines weapons and items. The `text`, `number`, `boolean`, and `list` formats retain their previous behavior.

Boxes use `x`, `y`, `width`, and `height` measured from the reference page's top-left corner. `page: 0` is the first page; the original three-card coordinate configuration places all cards there.

```text
scaleX = PDF.width / reference.width
scaleY = PDF.height / reference.height

pdfX      = PDF.originX + box.x * scaleX
pdfY      = PDF.originY + PDF.height - (box.y + box.height) * scaleY
pdfWidth  = box.width * scaleX
pdfHeight = box.height * scaleY
```

The real `MediaBox` dimensions and origin coordinates are used. Other templates can use pixel references if their actual reference width and height are provided in pixels. No DPI or pixel-to-point equivalence is assumed.

`AffinityCoordinateConverter.toPdfBox()` returns a box with a bottom-left origin. The layout engine then calculates the baseline from actual font metrics; the box's bottom edge is not used directly as the baseline.

## Class responsibilities

| Class | Responsibility |
| --- | --- |
| `JutsuFormFields` | AcroForm names, model paths, and styles for the current card. |
| `BandFormPdfGenerator` | Form validation and filling coordination. |
| `BandSheetPdfGenerator` | Independent ninja generation and resource-fetch reuse. |
| `PdfSheetComposer` | Proportional placement of cards on one page. |
| `PdfFormValueFormatter` | Technique composition and scalar-format delegation. |
| `PdfFormFieldRenderer` | Editable values and vector widget appearances. |
| `PdfIconProvider` | Loading and reusing embedded icons within a document. |
| `PdfSvgIcon` | Converting Affinity SVG paths into a vector PDF resource. |
| `PdfNoteMarkers` | Reading, validating, and removing icon marker notes. |
| `PdfNoteIconRenderer` | Placing an SVG within a note's rectangle. |
| `PdfTemplateConfig` | Validation of fields, styles, pages, and pending state. |
| `PdfTemplateConfigLoader` | Reading coordinate JSON. |
| `PdfTemplateLoader` | Loading the PDF template. |
| `PdfDocument` | Document, pages, embedded fonts, flattening, and serialization. |
| `BandFieldResolver` | Reading a data path from the squad. |
| `PdfFieldFormatter` | Converting values to text. |
| `PdfFontProvider` | Loading and embedding font resources. |
| `PdfFontFamily` | Glyph selection and font metrics. |
| `PdfTextLayout` | Line wrapping, size fitting, and text positions. |
| `PdfFieldRenderer` | Writing text onto a page. |
| `BandPdfGenerator` | Data snapshot and composition/form/coordinate engine selection. |
| `JutsuPdfTemplate` | Asset URLs and field mappings for the original sheet. |
| `NinjaGridPdfTemplate` | Shared editor icon URLs and the embedded sans-serif font for card view. |
| `NinjaGridPdfGenerator` | Localized grid input, document creation, and resource loading. |
| `NinjaGridPdfRenderer` | Three-column landscape A5 layout and continuation pages. |
| `PdfTemplatesService` | Available template catalog and selection independent of squad state. |
| `PdfGenerationService` | Asynchronous generation, status, and latest valid PDF bytes. |
| `BandPdfWorkerClient` | Starting a module worker, receiving the PDF or error, and releasing the worker. |
| `PdfFileName` | Download filename derived from the squad name. |
| `PdfBrowserFilesService` | Downloads, PDF tabs, and temporary URL lifecycle. |
| `PdfExportService` | Export actions for the current PDF and their result messages. |

## Usage

At the presentation boundary, using a `GameText` dictionary snapshot:

```ts
const template = new JutsuPdfTemplate(assetBaseUrl);
const localizedBand = gameText.band(bandSnapshot);
const bytes = await new BandPdfGenerator().generate(localizedBand, template);
```

The generator takes a JSON snapshot before loading resources. Model instances retain their methods and data; only the snapshot is used to fill the document. The original PDF is not modified.

**Generate and download PDF**, available in the toolbar and below the editor, calls `PdfExportService.generateAndDownload()`: it waits for `PdfGenerationService` to store valid bytes and starts download. Failed or stale generation does not download. Repeated clicks while generating are ignored. `getPdfBytes()` returns a copy of the latest valid result or `null`. Form edits, language changes, and template changes invalidate it; a result completed after either change is discarded, even if the previous template is selected again. Opening or closing a ninja-sheet dialog does not change data or invalidate the PDF.

The separate toolbar Download PDF button has been removed; Generate and download PDF remains available. `PdfFileName` uses `jutsu-squad-[name].pdf` for a named squad and `jutsu-squad.pdf` for an empty name. It preserves Unicode and replaces unsupported characters. **Open PDF for printing** is available before generation and after edits. `generateAndOpenForPrinting()` reserves a blank tab synchronously from the click, generates a fresh PDF, and navigates that tab to the completed Blob. This preserves browser user activation. Failed or stale results close the reserved tab; blocked or manually closed tabs produce a retryable error. The browser viewer supplies the print controls. See [the selection-panel and printing guide](../../../../docs/selection-panels.md).

Download URLs are revoked after 60 seconds. Printing URLs remain until their tabs close, even if the squad is edited in the meantime. `PdfBrowserFilesService` releases URLs and timers when the application is destroyed. Data and bytes stay in local memory; files are not uploaded, and no persistence is introduced.

## Background generation

The browser provider for `GENERATE_BAND_PDF` uses `BandPdfWorkerClient`. It sends the localized snapshot and plain template configuration to `band-pdf.worker.ts`, where the existing Angular-independent `BandPdfGenerator` runs. A successful response transfers the PDF byte buffer to the page. Engine errors retain their diagnostic text; worker startup/transport failures are reported through the existing localized status. Each request owns one worker, which terminates after success or failure. The stale-result checks for squad, language, and template changes remain on the page.

This matters for printing: opening the reserved tab puts the editor in the background. `pdf-lib` yields through timers while parsing and serializing, and Fontkit's font subsetting uses timer-backed stream callbacks. Firefox delays timers in inactive pages, which can make the loading tab appear stuck until the editor is selected again. The worker keeps this processing off the editor's window thread. See [Mozilla's inactive-tab timer documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#timeouts_in_inactive_tabs).

Angular CLI bundles the worker through `new Worker(new URL(..., import.meta.url), { type: 'module' })`; `webWorkerTsConfig` in `angular.json` points to `tsconfig.worker.json`. The worker has its own WebWorker TypeScript library configuration, and `npm run typecheck` checks both application and worker. Worker and asset URLs respect application subpaths. There is no new dependency or server-side generation.

Tests cover message delivery without advancing page timers, the application's worker provider, byte/error validation, failed posts, script/message errors, unsupported environments, and worker cleanup. A production-worker check also generated the real three-card PDF in a separate thread with parent timers and rendering suspended, then reopened it to verify one A4 page without an AcroForm or annotations. Browser UI verification still requires Firefox access.

## Available templates

`PDF_TEMPLATE_OPTIONS`, in `pdf-templates.service.ts`, registers each template's identifier, typed `labelKey`, and asset factory. It offers **Jutsu — three ninjas per page** and **Card view — landscape A5**. The test PDF in `public/templates/` is not offered as a character sheet.

For form-based templates, place the PDF in `src/assets/pdf/` and register an option with a unique identifier, fonts, and `formFields` mapping. `formIcons` defines note markers and their indicators; `repeatedSheet` composes ninja copies on one page. For coordinate templates, provide their JSON and omit `formFields` and `repeatedSheet`. `PdfTemplatesService` keeps selection outside `BandStateService`: changing the design does not modify ninjas or the squad name. The generator receives the selected template as an argument and remains independent of Angular and the DOM.

## Card view

`NinjaGridPdfTemplate` selects `NinjaGridPdfGenerator` through `ninjaGrid: true`. It recreates the desktop `.ninja-grid` as three vector columns on landscape A5 (595.28 × 419.53 pt), independent of the screen width, theme, or open dialogs. It includes names, ninja types, school names, all six stats, a single row of equipment icons matching the form, technique descriptions, chakra costs, and conditional Mokushin markers. The equipment row preserves the three weapon slots and two item slots, with dashed plus tokens for empty slots; names, descriptions, and action costs are omitted. Unset stats show a dash and zero remains visible. The PDF uses a light print palette and DejaVu Sans, with the same SVG assets as `UiIconComponent` through `UI_ICON_ASSETS`.

`GameText.band()` supplies localized labels, fallback ninja display names, and stable type/equipment IDs alongside the existing translated values. The snapshot and template remain serializable for the existing worker. No HTML capture, canvas, new package, or external service is required. The original form template and coordinate pipeline remain available.

The renderer measures the inventory row and each technique block before placing it. A block that would cross the bottom margin continues in that ninja's column on a later landscape page, with its name repeated. Other columns retain their own flow. A block larger than a page fails with a diagnostic identifying the ninja. Shared fonts and icons are fetched and embedded once per document. The existing generation, download, printing, and stale-result handling apply to this template as well.

## Editing configuration

1. Change boxes in the PDF while preserving field names. The generator uses their new positions automatically.
   To move or resize Mokushin, edit its note rectangle and preserve the identifier in the note contents.
2. Edit `JutsuFormFields` to rename fields, change their data, or adjust font sizes.
3. To add a font, include its local file and register the URL in `JutsuPdfTemplate.fontUrls`.
   PDF icons are registered in `JutsuPdfTemplate.iconUrls`; Mokushin uses the same SVG as the editor.
4. For coordinate templates only, edit boxes or styles in their JSON; complete a pending field's box and set `enabled` to `true` to activate it.

In coordinate configuration, `null` still means pending data, not zero. `getPendingPages()`, `getPendingFields()`, and `isReady()` report configuration state. `assertReady()` rejects incomplete active configuration before loading the PDF.

## Localized input

The editable domain stores stable IDs, numeric parameters, and structured costs. `GameText` converts these into a `LocalizedBandSnapshot` with the existing engine paths and text fields. `PdfGenerationService` captures the active dictionary once at generation start and invalidates bytes or pending results when language changes. Free-form names and filenames are preserved. See [the i18n guide](../../../../docs/i18n.md) for the full boundary and fallback behavior.

An option can provide `localized: { es: (base) => new SpanishTemplate(base) }`; `PdfTemplatesService.getTemplate(id, language)` uses it when present, otherwise the shared `create` factory. The original shared design has no fields for ninja type or equipment descriptions. Card view includes ninja types and a compact equipment icon row using the same localized input.
