import { PDFDocument, type PDFPage, rgb } from 'pdf-lib';
import type { LocalizedBandSnapshot } from '../../core/i18n/game-text';
import type { StatName } from '../../core/models/game-types';
import { EQUIPMENT_LIMITS } from '../../core/models/game-types';
import { UI_ICON_ASSETS } from '../../shared/ui-icon/ui-icon-assets';
import type { IconName } from '../../shared/ui-icon/ui-icon.component';
import { EquipmentPresentation } from '../character-sheet/equipment-presentation';
import { NinjaTypePresentation } from '../character-sheet/ninja-type-presentation';
import { PdfFieldRenderer } from './pdf-field-renderer';
import type { PdfFontFamily } from './pdf-font-family';
import type { PdfIconProvider } from './pdf-icon-provider';
import { PdfNoteIconRenderer } from './pdf-note-icon-renderer';
import { PdfTextLayout } from './pdf-text-layout';
import type { PdfInlineIconName } from './pdf-types';

interface GridText {
  text: string; size: number; icon?: IconName | null; muted?: boolean;
  right?: string; rightIcon?: IconName;
}
interface GridSection { rows: GridText[]; framed?: boolean; }
interface ColumnCursor { page: number; top: number; x: number; }

const PAGE_SIZE = [595.28, 419.53] as const;
const MARGIN = 14;
const GAP = 8;
const PADDING = 8;
const COLUMN_WIDTH = (PAGE_SIZE[0] - MARGIN * 2 - GAP * 2) / 3;
const CONTENT_WIDTH = COLUMN_WIDTH - PADDING * 2;
const STATS: readonly StatName[] = ['chakra', 'attack', 'defense', 'movement', 'skill', 'health'];

/** Measures complete blocks before drawing, continuing each column on later pages as needed. */
export class NinjaGridPdfRenderer {
  private readonly text = new PdfFieldRenderer();
  private readonly layout = new PdfTextLayout();
  private readonly iconRenderer = new PdfNoteIconRenderer();
  private readonly equipment = new EquipmentPresentation();
  private readonly types = new NinjaTypePresentation();

  constructor(private readonly document: PDFDocument, private readonly family: PdfFontFamily,
    private readonly icons: PdfIconProvider) {}

  async render(band: LocalizedBandSnapshot): Promise<void> {
    const top = PAGE_SIZE[1] - MARGIN - (band.name ? 24 : 0);
    const pageAt = (index: number): PDFPage => {
      while (this.document.getPageCount() <= index) {
        const page = this.document.addPage([...PAGE_SIZE]);
        if (band.name) this.drawText(page, band.name, MARGIN, PAGE_SIZE[1] - MARGIN, PAGE_SIZE[0] - MARGIN * 2, 11, 20);
        for (let column = 0; column < 3; column++) {
          page.drawRectangle({ x: MARGIN + column * (COLUMN_WIDTH + GAP), y: MARGIN,
            width: COLUMN_WIDTH, height: top - MARGIN, borderWidth: .6,
            borderColor: rgb(.78, .8, .83), color: rgb(1, 1, 1) });
        }
        this.drawText(page, String(this.document.getPageCount()), PAGE_SIZE[0] - MARGIN - 20, 10, 20, 6, 8, true, 'right');
      }
      return this.document.getPage(index);
    };

    for (const [index, ninja] of band.ninjas.entries()) {
      try {
        const cursor: ColumnCursor = { page: 0, top: top - PADDING, x: MARGIN + index * (COLUMN_WIDTH + GAP) + PADDING };
        const reserve = async (height: number): Promise<void> => {
          const capacity = top - MARGIN - PADDING * 2;
          if (height > capacity) throw new Error('A grid section is too tall to fit on a page.');
          if (cursor.top - height < MARGIN + PADDING) {
            const heading: GridSection = { rows: [{ text: ninja.displayName, size: 9 }] };
            if (height + this.sectionHeight(heading) > capacity) throw new Error('A grid section and its continued heading are too tall to fit on a page.');
            cursor.page++;
            cursor.top = top - PADDING;
            // Keep a continued column identifiable without changing the other ninjas' pagination.
            await this.drawSection(pageAt(cursor.page), heading, cursor);
          }
        };
        const place = async (section: GridSection): Promise<void> => {
          await reserve(this.sectionHeight(section));
          await this.drawSection(pageAt(cursor.page), section, cursor);
        };
        await place({ rows: [
          { text: ninja.displayName, size: 10.5 },
          { text: ninja.type || band.labels.noType, size: 7, icon: this.types.icon(ninja.typeId), muted: true },
          { text: ninja.techniqueGroup.name || band.labels.noSchool, size: 7, icon: 'book', muted: true },
        ] });
        await reserve(46);
        await this.drawStats(pageAt(cursor.page), ninja, band.labels.stats, cursor);
        await reserve(26);
        await this.drawInventory(pageAt(cursor.page), ninja, cursor);

        const techniques = ninja.techniqueGroup.techniques;
        if (!techniques.length) await place({ rows: [{ text: band.labels.emptyTechniques, size: 7, muted: true }], framed: true });
        for (const technique of techniques) {
          const rows: GridText[] = [
            { text: technique.name, size: 8, right: technique.chakra, rightIcon: 'chakra' },
            { text: technique.description, size: 7, muted: true },
          ];
          if (technique.isMokushin) rows.push({ text: band.labels.mokushin, size: 6, icon: 'mokushin', muted: true });
          await place({ rows, framed: true });
        }
      } catch (error) {
        throw new Error(`Unable to generate ninja ${index + 1}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }
  }

  private rowLayout(row: GridText, width: number) {
    const iconWidth = row.icon ? 14 : 0;
    const rightWidth = row.right ? Math.min(width * .45, this.family.getTextMetrics(row.right, 7).width + (row.rightIcon ? 16 : 4)) : 0;
    const textWidth = width - iconWidth - rightWidth - (rightWidth ? 6 : 0);
    const lines = this.layout.wrap(row.text, this.family, row.size, textWidth);
    if (!lines) throw new Error('A character does not fit the grid column.');
    return { iconWidth, rightWidth, textWidth, height: Math.max(row.size * 1.3 * lines.length, row.icon ? 10 : 0) };
  }

  private sectionHeight(section: GridSection): number {
    const inset = section.framed ? 5 : 0;
    return section.rows.reduce((height, row) => height + this.rowLayout(row, CONTENT_WIDTH - inset * 2).height + 2, inset * 2) + 5;
  }

  private async drawSection(page: PDFPage, section: GridSection, cursor: ColumnCursor): Promise<void> {
    const height = this.sectionHeight(section);
    const inset = section.framed ? 5 : 0;
    const width = CONTENT_WIDTH - inset * 2;
    if (section.framed) page.drawRectangle({ x: cursor.x, y: cursor.top - height + 5, width: CONTENT_WIDTH,
      height: height - 5, color: rgb(.97, .975, .98), borderColor: rgb(.84, .85, .87), borderWidth: .5 });
    let top = cursor.top - inset;
    for (const row of section.rows) {
      const layout = this.rowLayout(row, width);
      const x = cursor.x + inset;
      if (row.icon) await this.drawIcon(page, row.icon, x, top, 10);
      this.drawText(page, row.text, x + layout.iconWidth, top, layout.textWidth, row.size, layout.height, row.muted);
      if (row.right) {
        const rightX = x + width - layout.rightWidth;
        if (row.rightIcon) await this.drawIcon(page, row.rightIcon, rightX, top, 10);
        this.drawText(page, row.right, rightX + (row.rightIcon ? 13 : 0), top,
          layout.rightWidth - (row.rightIcon ? 13 : 0), 7, layout.height, true, 'right');
      }
      top -= layout.height + 2;
    }
    cursor.top -= height;
  }

  private async drawStats(page: PDFPage, ninja: LocalizedBandSnapshot['ninjas'][number],
    labels: LocalizedBandSnapshot['labels']['stats'], cursor: ColumnCursor): Promise<void> {
    page.drawRectangle({ x: cursor.x, y: cursor.top - 40, width: CONTENT_WIDTH, height: 40, color: rgb(.94, .95, .97) });
    const width = CONTENT_WIDTH / STATS.length;
    for (const [index, stat] of STATS.entries()) {
      const x = cursor.x + index * width;
      await this.drawIcon(page, stat, x + (width - 10) / 2, cursor.top - 4, 10);
      this.drawText(page, String(ninja.stats[stat] ?? '—'), x, cursor.top - 16, width, 9, 12, false, 'center');
      this.drawText(page, labels[stat], x, cursor.top - 29, width, 5.5, 8, true, 'center');
    }
    cursor.top -= 46;
  }

  private async drawInventory(page: PDFPage, ninja: LocalizedBandSnapshot['ninjas'][number], cursor: ColumnCursor): Promise<void> {
    const tokenSize = 16;
    const gap = 3;
    const groupWidth = (count: number) => 15 + count * (tokenSize + gap);
    for (const kind of ['weapons', 'items'] as const) {
      let x = kind === 'weapons' ? cursor.x : cursor.x + CONTENT_WIDTH - groupWidth(EQUIPMENT_LIMITS.items);
      await this.drawIcon(page, kind === 'weapons' ? 'weapons' : 'equipment', x, cursor.top - 3, 11);
      x += 15;
      for (let slot = 0; slot < EQUIPMENT_LIMITS[kind]; slot++) {
        const entry = ninja.equipment[kind][slot];
        const y = cursor.top - tokenSize;
        page.drawRectangle({ x, y, width: tokenSize, height: tokenSize, borderWidth: .5,
          borderColor: rgb(.65, .68, .72), color: rgb(.97, .975, .98),
          borderDashArray: entry?.id ? undefined : [2, 2] });
        if (entry?.id) await this.drawIcon(page, this.equipment.icon(kind, entry.id), x + 2, cursor.top - 2, tokenSize - 4);
        else {
          const color = rgb(.55, .58, .62);
          page.drawLine({ start: { x: x + 5, y: y + 8 }, end: { x: x + 11, y: y + 8 }, thickness: .6, color });
          page.drawLine({ start: { x: x + 8, y: y + 5 }, end: { x: x + 8, y: y + 11 }, thickness: .6, color });
        }
        x += tokenSize + gap;
      }
    }
    cursor.top -= 26;
  }

  private drawText(page: PDFPage, text: string, x: number, top: number, width: number, size: number,
    height: number, muted = false, alignment: 'left' | 'center' | 'right' = 'left'): void {
    this.text.render(page, text, { x, y: top - height, width, height }, {
      font: 'DejaVu Sans', fontSize: size, fontSizeUnit: 'pt', lineHeight: size * 1.3,
      alignment, color: muted ? '#505969' : '#182334',
    }, this.family);
  }

  private async drawIcon(page: PDFPage, name: IconName, x: number, top: number, size: number): Promise<void> {
    if (!Object.hasOwn(UI_ICON_ASSETS, name)) return;
    const icon = await this.icons.get(name as PdfInlineIconName);
    this.iconRenderer.render({ page, box: { x, y: top - size, width: size, height: size } }, icon);
  }
}
