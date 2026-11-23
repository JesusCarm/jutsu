import type { PDFFont } from 'pdf-lib';
import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PdfSvgIcon } from './pdf-svg-icon';

export class PdfDocument {
  #document: PDFDocument;
  #textFontPromise: Promise<PDFFont> | null = null;

  constructor(document: PDFDocument) {
    this.#document = document;
  }

  static async fromBytes(bytes: Uint8Array | ArrayBuffer) {
    const document = await PDFDocument.load(bytes, { updateMetadata: false });
    return new PdfDocument(document);
  }

  getPageCount() {
    return this.#document.getPageCount();
  }

  getPage(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.getPageCount()) {
      throw new RangeError('PDF page index is out of range.');
    }
    return this.#document.getPage(index);
  }

  getPageInfo(index: number) {
    const { width, height } = this.getPage(index).getSize();
    return { index, width, height };
  }

  getPagesInfo() {
    return Array.from({ length: this.getPageCount() }, (_, index) => this.getPageInfo(index));
  }

  getForm() {
    return this.#document.getForm();
  }

  flattenForm(): void {
    // Keep our fitted, Unicode-aware appearances instead of regenerating them.
    this.getForm().flatten({ updateFieldAppearances: false });
    this.#document.catalog.delete(PDFName.of('AcroForm'));
  }

  prepareForText() {
    this.#textFontPromise ??= this.#document.embedFont(StandardFonts.Helvetica);
    return this.#textFontPromise;
  }

  async embedFont(source: string | Uint8Array, subset = typeof source !== 'string') {
    if (typeof source !== 'string') this.#document.registerFontkit(fontkit);
    return this.#document.embedFont(source, { subset });
  }

  embedSvgIcon(source: string) {
    return new PdfSvgIcon(this.#document.context).embed(source);
  }

  async save() {
    return this.#document.save();
  }
}
