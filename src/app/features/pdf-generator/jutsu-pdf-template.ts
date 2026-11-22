import type { PdfTemplate } from './pdf-types';

export class JutsuPdfTemplate implements PdfTemplate {
  readonly configUrl: string;
  readonly pdfUrl: string;
  readonly fontUrls: Record<string, string>;

  constructor(assetBase: string | URL) {
    this.configUrl = new URL('pdf/fichas_rellenables_coordenadas.json', assetBase).href;
    this.pdfUrl = new URL('pdf/fichas_rellenables.pdf', assetBase).href;
    this.fontUrls = {
      'Eagle Lake': new URL('fonts/Eagle_Lake/EagleLake-Regular.ttf', assetBase).href,
      'DejaVu Sans': new URL('fonts/DejaVu_Sans/DejaVuSans.ttf', assetBase).href,
    };
  }
}
