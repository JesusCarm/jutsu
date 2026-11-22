import type { FetchResource } from './pdf-types';
import { PdfDocument } from './pdf-document';

export class PdfTemplateLoader {
  #fetchResource: FetchResource;

  constructor(fetchResource: FetchResource = (url) => globalThis.fetch(url)) {
    this.#fetchResource = fetchResource;
  }

  async load(url: string) {
    const response = await this.#fetchResource(url);
    if (!response.ok) {
      throw new Error(`Unable to load PDF template (HTTP ${response.status}).`);
    }
    return PdfDocument.fromBytes(await response.arrayBuffer());
  }
}
