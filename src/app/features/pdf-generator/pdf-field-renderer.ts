import type { PDFPage } from 'pdf-lib';
import type { PdfFontFamily } from './pdf-font-family';
import type { PdfBox, ReadyTypography } from './pdf-types';
import { rgb } from 'pdf-lib';
import { PdfTextLayout } from './pdf-text-layout';

export class PdfFieldRenderer {
  constructor(readonly layout = new PdfTextLayout()) {
  }

  render(page: PDFPage, text: string, box: PdfBox, style: ReadyTypography, family: PdfFontFamily) {
    if (!text) return;
    const layout = this.layout.fit(text, family, box, style);
    const channels = [1, 3, 5].map((index) => parseInt(style.color.slice(index, index + 2), 16) / 255);
    const color = rgb(channels[0], channels[1], channels[2]);
    for (const line of layout.lines) {
      let x = line.x;
      for (const { record, text: runText } of family.getRuns(line.text)) {
        page.drawText(runText, { x, y: line.y, size: layout.fontSize, font: record.font, color });
        x += family.getRunMetrics(record, runText).advance * layout.fontSize;
      }
    }
  }
}
