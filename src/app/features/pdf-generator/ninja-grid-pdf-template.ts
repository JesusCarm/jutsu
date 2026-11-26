import { UI_ICON_ASSETS } from '../../shared/ui-icon/ui-icon-assets';
import type { PdfInlineIconName, PdfTemplate } from './pdf-types';

export class NinjaGridPdfTemplate implements PdfTemplate {
  readonly ninjaGrid = true;
  readonly fontUrls: Record<string, string>;
  readonly iconUrls: Partial<Record<PdfInlineIconName, string>>;

  constructor(assetBase: string | URL) {
    this.fontUrls = { 'DejaVu Sans': new URL('fonts/DejaVu_Sans/DejaVuSans.ttf', assetBase).href };
    this.iconUrls = Object.fromEntries(Object.entries(UI_ICON_ASSETS)
      .filter(([name]) => name !== 'flagEn' && name !== 'flagEs')
      .map(([name, file]) => [name, new URL(`icons/${file}`, assetBase).href]));
  }
}
