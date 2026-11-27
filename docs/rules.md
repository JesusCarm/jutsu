# Contextual quick reference

The editor reads Markdown from `src/assets/rules/en/` or `src/assets/rules/es/`, following the selected interface language. `src/assets/rules/references.json` maps a stable reference ID to a locale-independent filename, an explicit HTML anchor and optional related reference IDs. For example, `actions.md` resolves to `assets/rules/en/actions.md` in English. The Markdown remains the editorial source; its text, numeric mechanics, icons and diagrams are not copied into translation dictionaries or component templates.

## Using the reference

- The toolbar book button opens the complete reference: all 72 rules in 19 chapters, including attributes, basic concepts, game flow, combat, actions, team creation, equipment and all Jutsu schools. A contents index moves to a chapter within the scrollable dialog.
- Attribute icons on mini sheets and full sheets are help buttons with localized tooltips and accessible names.
- Each technique and equipment entry has a help button. Equipment help is separate from the selection button, so opening a rule never selects an item.
- Dotted terms in technique descriptions, equipment effects and the reference itself open the corresponding rule. The bilingual aliases in `src/assets/rules/keywords.json` include DI/ID/ER, LDV/LoS and the main combat terms. Phrases take precedence over individual words, and matching respects word boundaries.

Both reference views use centered Angular CDK dialogs. Rule titles and keyword links in the complete reference open a separate contextual dialog above it. Closing that dialog returns to the same reading position and focused link in the complete reference. Closing the complete reference restores focus to the header button.

Individual help buttons can also open a contextual dialog over a selection panel or full sheet. Following another rule inside a contextual dialog replaces its content and adds a Previous rule action. Closing with the close button, Escape or the backdrop restores focus to the original trigger and leaves the underlying panel in place. Consulting rules does not update the squad or invalidate a generated PDF.

Content, titles, related links and controls follow the selected language, with the matching HTML `lang` attribute. Changing language while a reference is open reloads the current rule without closing the dialog or clearing its navigation history. Late responses from the previous language are ignored.

The English action name for Impulso is **Burst**. **Dash** remains a keyword alias for older wording. Technique, equipment, school and attribute names match the application dictionaries. The English reference uses **Engagement Range (ER)** to match the character sheet, and explains that **Interaction Distance (ID)** is the same concept.

## Content and assets

`RulesService` loads only requested Markdown files, shares concurrent requests and caches successfully parsed documents separately by language. Individual help requests only the necessary files. Opening the complete reference loads all indexed rules, sharing one request per document; its contextual dialogs then reuse the cache. Failed requests or missing sections can be retried without clearing the other language's cache. Rule text is first requested when either type of reference is opened.

`rule-chapters.ts` defines the reading order and localized chapter labels. The complete view composes the same parsed sections as the individual dialogs, rather than maintaining a second Markdown copy. `RuleContentComponent` shares paragraph, image, list and table rendering between both views.

`readRuleDocument()` supports the reference's explicit anchors, level-three section headings, heading icons, paragraphs, bold spans, SVG images, simple unordered lists and tables. It produces typed blocks rendered by Angular; it does not inject raw Markdown HTML. Adding other Markdown syntax requires extending the reader and renderer together.

Paths such as `assets/icons/chakra_ico.svg` and `assets/diagrams/di.svg` resolve against the application's base URL, including deployments under a subdirectory. Only local SVG files beneath these two directories are accepted; diagrams may also use `en/` or `es/` subdirectories. English diagrams with attribute labels use `assets/diagrams/en/`, with ATK, DEF, CHK and HP matching the editor. Diagram panels keep a white background so their supplied dark labels and strokes remain readable in either theme; heading icons use the application's existing icon filter.

`rule-references.ts` contains explicit mappings between language-neutral game catalog IDs and the editorial references. Keep these mappings and anchors stable when translated names change. When adding or renaming a reference, update both language documents, `references.json`, any catalog mappings and any keyword aliases. Missing translations produce the normal load error and retry action rather than silently displaying another language.

## Catalog consistency

The reference was reviewed against all four ninja profiles, 36 techniques and seven equipment entries. The review covered names, Chakra costs (including variable costs and upkeep), action costs, numeric effects, ranges and restrictions. Corrections align English names such as Void Palm, Skin Shedding, Steel Rain, Explosive Seal and Gentle Defense with the editor, and clarify that Kunai plus Explosive Seal requires two actions in the same activation. Reference summaries retain their editorial phrasing.

The application catalog remains the source for character-sheet mechanics. Tests compare both references with the real catalog for names, costs, numeric parameters and ninja-profile values. They supplement the editorial review; they do not interpret the meaning of arbitrary prose. When game mechanics change, review the relevant Markdown in both languages as well as the catalog and dictionaries.

## Verification

Run `npm run typecheck`, `npm test` and `npm run build`. Tests read the real documents in both languages to verify every reference, related target, image, table and catalog mapping. Component tests cover the complete reference and its chapter index, child dialogs and reading-position preservation, nested school/equipment help, focus restoration, keyboard and backdrop dismissal, rule history, live language changes in both dialog layers, language-specific caching, retrying failures, late responses, and preserving squad data and controls.
