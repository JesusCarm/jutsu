import { PDFDocument } from 'pdf-lib';

/** Places independent, flattened cards in equal vertical slots on one page. */
export class PdfSheetComposer {
  async compose(cards: readonly Uint8Array[], pageSize: readonly [number, number]): Promise<Uint8Array> {
    if (!cards.length || !pageSize.every((length) => Number.isFinite(length) && length > 0)) {
      throw new Error('A PDF sheet requires cards and positive page dimensions.');
    }
    const output = await PDFDocument.create();
    const [width, height] = pageSize;
    const page = output.addPage([width, height]);
    const slotHeight = height / cards.length;
    for (const [index, bytes] of cards.entries()) {
      const card = await PDFDocument.load(bytes, { updateMetadata: false });
      if (card.getPageCount() !== 1) throw new Error('Each ninja template must contain exactly one page.');
      const embedded = await output.embedPage(card.getPage(0));
      const scale = Math.min(width / embedded.width, slotHeight / embedded.height);
      const cardWidth = embedded.width * scale;
      const cardHeight = embedded.height * scale;
      page.drawPage(embedded, {
        x: (width - cardWidth) / 2,
        y: height - (index + 1) * slotHeight + (slotHeight - cardHeight) / 2,
        width: cardWidth, height: cardHeight,
      });
    }
    return output.save({ updateFieldAppearances: false });
  }
}
