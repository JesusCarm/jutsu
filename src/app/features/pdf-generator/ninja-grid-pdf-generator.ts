import { PDFDocument } from 'pdf-lib';
import type { LocalizedBandSnapshot } from '../../core/i18n/game-text';
import { PdfDocument } from './pdf-document';
import { PdfFontProvider } from './pdf-font-provider';
import { PdfIconProvider } from './pdf-icon-provider';
import { NinjaGridPdfRenderer } from './ninja-grid-pdf-renderer';
import type { FetchResource, PdfTemplate } from './pdf-types';

/** Generates the desktop grid layout without depending on the viewport or DOM. */
export class NinjaGridPdfGenerator {
  constructor(private readonly fetchResource: FetchResource) {}

  async generate(data: unknown, template: PdfTemplate): Promise<Uint8Array> {
    if (!data || typeof data !== 'object' || !('ninjas' in data)
      || !Array.isArray(data.ninjas) || data.ninjas.length !== 3 || !('labels' in data)) {
      throw new Error('The ninja grid requires a localized squad with exactly 3 ninjas.');
    }
    const band = data as LocalizedBandSnapshot;
    const document = await PDFDocument.create();
    document.setTitle(band.name);
    document.setCreator('Jutsu Band Builder');
    const pdf = new PdfDocument(document);
    const fonts = new PdfFontProvider(pdf, template.fontUrls, this.fetchResource);
    const family = await fonts.getFamily({ font: 'DejaVu Sans' });
    const icons = new PdfIconProvider(pdf, template.iconUrls ?? {}, this.fetchResource);
    await new NinjaGridPdfRenderer(document, family, icons).render(band);
    return pdf.save();
  }
}
