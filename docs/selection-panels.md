# Compact character editing

The mini sheet is the entry point for editing a ninja. Its name is an inline text input, matching the squad-name interaction. The type label is a button; equipment has three weapon buttons and two item buttons; the school button sits next to the name. Empty selections show an action label or a plus placeholder. Selected equipment shows its icons; the school button shows both its icon and translated school name. These buttons have localized tooltips and accessible names.

Each trigger opens a modal panel at the right edge. Panels use the installed Angular CDK Dialog and Overlay packages, with no new dependency. On narrow screens the panel can fill the viewport. CDK traps focus, blocks background scrolling, closes on Escape or the backdrop, and restores focus to the original trigger. Selecting a value closes the panel and applies that one selection. Closing without selecting preserves the squad and any generated PDF.

## Responsibilities

| Component or class | Responsibility |
| --- | --- |
| `NinjaNameEditorComponent` | Inline free-form ninja name and its stable form control. |
| `NinjaSummaryComponent` | Mini sheet, type and school triggers, and the mobile sheet-dialog action. |
| `EquipmentSummaryComponent` | Fixed weapon/item buttons, labels, and selected icons. |
| `NinjaDialogsService` | Opening selection or sheet panels for the target ninja/slot and applying selection results through `BandStateService`. |
| `NinjaTypeDialogComponent` | Four type profiles with read-only stats. |
| `WeaponDialogComponent` | Weapon selection for one slot. |
| `ItemDialogComponent` | Item selection for one slot. |
| `EquipmentChoicesComponent` | Shared equipment choices with icons, action costs, and descriptions. |
| `TechniqueSchoolDialogComponent` | All twelve schools with their three techniques. |
| `NinjaDetailsDialogComponent` | Read-only full sheet: identity, labeled stats, school, techniques and expanded equipment effects. |
| `SelectionPanelComponent` | Shared title, close control, and scrolling content. |
| `TechniqueListComponent` | Shared read-only technique names, descriptions, Chakra costs, and Mokushin. |
| `EquipmentEffectsComponent` | Selected equipment descriptions under “View equipment effects.” |
| `NinjaEditorComponent` | Compact details beneath a mini sheet; no duplicate selection controls. |

The school preview and the sheet use the same technique component. Weapon and item dialogs share equipment presentation and list code, while keeping separate dialog components. Empty-choice entries allow clearing a type, school, or equipment slot. The catalog still has three weapons and four items; a ninja can carry at most three weapons and two items. Selecting an empty slot out of order or clearing one does not shift other slots.

Below 56 rem, the three mini sheets stack vertically at full width. “View details” opens a separate panel for that ninja; the inline detail panels are hidden on mobile. The full sheet includes the name, type, six labeled stats, school, three techniques with Chakra costs and Mokushin, and equipment descriptions open by default. It is read-only and cannot launch nested selection dialogs. At desktop width the three mini sheets remain in columns with all three inline detail panels visible. Mini sheets have no selected/active state or card-wide click handler. Their editing buttons work at both sizes. Existing name controls and equipment buttons remain in place as choices or language change. Opening or closing the full sheet does not publish a squad revision or invalidate the PDF. The sheet supports close, Escape, backdrop dismissal and focus restoration, like the selection panels.

## Contextual rules

Attribute, technique and equipment help can open a separate reference dialog above a selection panel or full sheet. Closing the reference returns to the panel and its original help button without changing the selection. Rule navigation stays inside the same reference dialog. Type-profile previews keep plain attribute icons inside their selection buttons to avoid nested interactive controls. See [contextual rules](rules.md) for the content format, asset resolution and reference lifecycle.

## Printing

The top toolbar retains Generate and download PDF and Open PDF for printing. The separate Download PDF button has been removed. Printing is available before a PDF has been generated and after edits; it is temporarily disabled while generation or language loading is in progress.

`PdfExportService.generateAndOpenForPrinting()` synchronously reserves a blank tab through `PdfBrowserFilesService.prepareForPrinting()`, then generates a fresh squad snapshot in a dedicated module Web Worker. Reserving the tab during the click preserves browser user activation, including Firefox popup behavior. Keeping PDF and font processing in the worker avoids depending on timers in the hidden editor page while the print tab is active. The loading message is localized. On success the reserved tab navigates to a PDF Blob; the browser viewer supplies print controls. Generation errors or stale results close the unused tab and keep the existing status message. A blocked or manually closed tab produces a retryable message. Duplicate generation requests are ignored.

`PendingPdfViewer` owns a pending tab until its bytes are shown or it is canceled. Pending tabs close on application destruction; displayed PDF Blob URLs retain the previous lifecycle and are released after their viewers close. No PDF layout, coordinates, game rules, or filenames have changed.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run build`. Component tests exercise all four panels, profile stats, independent slots, all school previews, descriptions, clearing selections, keyboard dismissal, focus restoration, language updates, name-control identity, full-sheet dialogs for each ninja, and unselectable mini sheets. Export tests verify tab reservation before asynchronous generation, blocked/closed tabs, stale results, cleanup, and generating again after edits.
