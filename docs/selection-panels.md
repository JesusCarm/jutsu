# Compact character editing

The mini sheet is the entry point for editing a ninja. Its name is an inline text input, matching the squad-name interaction. The type label is a button; equipment has three weapon buttons and two item buttons; the school button sits next to the name. Empty selections show an action label or a plus placeholder. Selected equipment shows its icons; the school button shows both its icon and translated school name. These buttons have localized tooltips and accessible names.

Each trigger opens a modal panel at the right edge. Panels use the installed Angular CDK Dialog and Overlay packages, with no new dependency. On narrow screens the panel can fill the viewport. CDK traps focus, blocks background scrolling, closes on Escape or the backdrop, and restores focus to the original trigger. Selecting a value closes the panel and applies that one selection. Closing without selecting preserves the squad and any generated PDF.

## Responsibilities

| Component or class | Responsibility |
| --- | --- |
| `NinjaNameEditorComponent` | Inline free-form ninja name and its stable form control. |
| `NinjaSummaryComponent` | Mini sheet, type and school triggers, mobile detail selection. |
| `EquipmentSummaryComponent` | Fixed weapon/item buttons, labels, and selected icons. |
| `NinjaSelectionService` | Opening panels with the target ninja/slot and applying the result through `BandStateService`. |
| `NinjaTypeDialogComponent` | Four type profiles with read-only stats. |
| `WeaponDialogComponent` | Weapon selection for one slot. |
| `ItemDialogComponent` | Item selection for one slot. |
| `EquipmentChoicesComponent` | Shared equipment choices with icons, action costs, and descriptions. |
| `TechniqueSchoolDialogComponent` | All twelve schools with their three techniques. |
| `SelectionPanelComponent` | Shared title, close control, and scrolling content. |
| `TechniqueListComponent` | Shared read-only technique names, descriptions, Chakra costs, and Mokushin. |
| `EquipmentEffectsComponent` | Selected equipment descriptions under “View equipment effects.” |
| `NinjaEditorComponent` | Compact details beneath a mini sheet; no duplicate selection controls. |

The school preview and the sheet use the same technique component. Weapon and item dialogs share equipment presentation and list code, while keeping separate dialog components. Empty-choice entries allow clearing a type, school, or equipment slot. The catalog still has three weapons and four items; a ninja can carry at most three weapons and two items. Selecting an empty slot out of order or clearing one does not shift other slots.

Below 56 rem, the three mini sheets stack vertically at full width. “View details” selects which character's descriptions appear below the stack. At desktop width the three mini sheets appear in columns with all three detail panels visible, and clicking a summary does not change mobile selection state. The editing buttons work at both sizes. Existing name controls and equipment buttons remain in place as selections or language change.

## Printing

The top toolbar retains Generate and download PDF and Open PDF for printing. The separate Download PDF button has been removed. Printing is available before a PDF has been generated and after edits; it is temporarily disabled while generation or language loading is in progress.

`PdfExportService.generateAndOpenForPrinting()` synchronously reserves a blank tab through `PdfBrowserFilesService.prepareForPrinting()`, then generates a fresh squad snapshot. Reserving the tab during the click preserves browser user activation, including Firefox popup behavior. The loading message is localized. On success the reserved tab navigates to a PDF Blob; the browser viewer supplies print controls. Generation errors or stale results close the unused tab and keep the existing status message. A blocked or manually closed tab produces a retryable message. Duplicate generation requests are ignored.

`PendingPdfViewer` owns a pending tab until its bytes are shown or it is canceled. Pending tabs close on application destruction; displayed PDF Blob URLs retain the previous lifecycle and are released after their viewers close. No PDF layout, coordinates, game rules, or filenames have changed.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run build`. Component tests exercise all four panels, profile stats, independent slots, all school previews, descriptions, clearing selections, keyboard dismissal, focus restoration, language updates, name-control identity, and desktop/mobile selection behavior. Export tests verify tab reservation before asynchronous generation, blocked/closed tabs, stale results, cleanup, and generating again after edits.
