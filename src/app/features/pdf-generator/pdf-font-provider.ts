import type { Font } from '@pdf-lib/fontkit';
import type { PdfDocument } from './pdf-document';
import type { FontRecord, FetchResource, Typography } from './pdf-types';
import fontkit from '@pdf-lib/fontkit';
import { StandardFonts } from 'pdf-lib';
import { PdfFontFamily } from './pdf-font-family';

export class PdfFontProvider {
  readonly fonts = new Map<string, Promise<FontRecord>>();
  readonly families = new Map<string, Promise<PdfFontFamily>>();

  constructor(readonly pdf: PdfDocument, readonly urls: Record<string, string> = {}, readonly fetchResource: FetchResource = (url) => globalThis.fetch(url)) {
  }

  loadFont(name: string) {
    if (!this.fonts.has(name)) this.fonts.set(name, this.loadFontResource(name));
    return this.fonts.get(name)!;
  }

  async loadFontResource(name: string): Promise<FontRecord> {
    let raw: Font | null = null;
    let source: string | Uint8Array = name;
    if (!(Object.values(StandardFonts) as string[]).includes(name)) {
      const url = this.urls[name];
      if (!url) throw new Error(`No font file configured for ${name}.`);
      const response = await this.fetchResource(url);
      if (!response.ok) throw new Error(`Unable to load font ${name} (HTTP ${response.status}).`);
      source = new Uint8Array(await response.arrayBuffer());
      raw = fontkit.create(source) as Font;
    }
    const font = await this.pdf.embedFont(source);
    return { font, raw, characters: new Set(font.getCharacterSet()) };
  }

  async getFamily(style: Pick<Typography, 'font' | 'fallbackFonts'>) {
    if (!style.font) throw new Error('A primary font is required.');
    const names = [...new Set([style.font, ...(style.fallbackFonts ?? [])])];
    const key = JSON.stringify(names);
    if (!this.families.has(key)) {
      this.families.set(key, Promise.all(names.map((name) => this.loadFont(name)))
        .then((fonts) => new PdfFontFamily(fonts)));
    }
    return this.families.get(key)!;
  }
}
