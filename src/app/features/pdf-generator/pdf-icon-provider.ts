import type { PdfDocument } from './pdf-document';
import type { FetchResource, PdfInlineIconName, PdfInlineIcon } from './pdf-types';

export class PdfIconProvider {
  private readonly icons = new Map<PdfInlineIconName, Promise<PdfInlineIcon>>();

  constructor(readonly pdf: PdfDocument, readonly urls: Partial<Record<PdfInlineIconName, string>>,
    readonly fetchResource: FetchResource) {}

  get(name: PdfInlineIconName): Promise<PdfInlineIcon> {
    let icon = this.icons.get(name);
    if (!icon) {
      icon = this.load(name);
      this.icons.set(name, icon);
    }
    return icon;
  }

  private async load(name: PdfInlineIconName): Promise<PdfInlineIcon> {
    const url = this.urls[name];
    if (!url) throw new Error(`Missing PDF icon URL: ${name}`);
    const response = await this.fetchResource(url);
    if (!response.ok) throw new Error(`Unable to load PDF icon ${name}: ${response.status}`);
    return this.pdf.embedSvgIcon(await response.text());
  }
}
