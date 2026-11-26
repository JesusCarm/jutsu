import type { PdfTemplate } from './pdf-types';
import { JutsuFormFields } from './jutsu-form-fields';

export class JutsuPdfTemplate implements PdfTemplate {
  readonly formFields = new JutsuFormFields().fields;
  readonly formIcons = new JutsuFormFields().icons;
  readonly formOutput = 'flattened';
  readonly repeatedSheet = { count: 3, pageSize: [595.28, 841.89] as const };
  readonly configUrl: string;
  readonly pdfUrl: string;
  readonly fontUrls: Record<string, string>;
  readonly iconUrls: Record<'mokushin', string>;

  constructor(assetBase: string | URL) {
    this.configUrl = new URL('pdf/fichas_rellenables_coordenadas.json', assetBase).href;
    this.pdfUrl = new URL('pdf/fichas_rellenables.pdf', assetBase).href;
    this.fontUrls = {
      'Eagle Lake': new URL('fonts/Eagle_Lake/EagleLake-Regular.ttf', assetBase).href,
      'DejaVu Sans': new URL('fonts/DejaVu_Sans/DejaVuSans.ttf', assetBase).href,
    };
    this.iconUrls = { mokushin: new URL('icons/mokushin_ico.svg', assetBase).href };
  }
}
