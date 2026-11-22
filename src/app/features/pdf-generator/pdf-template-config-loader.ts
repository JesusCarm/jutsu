import type { FetchResource, PdfTemplateDefinition } from './pdf-types';
import { PdfTemplateConfig } from './pdf-template-config';

export class PdfTemplateConfigLoader {
  #fetchResource: FetchResource;

  constructor(fetchResource: FetchResource = (url) => globalThis.fetch(url)) {
    this.#fetchResource = fetchResource;
  }

  async load(url: string) {
    const response = await this.#fetchResource(url);
    if (!response.ok) {
      throw new Error(`Unable to load template configuration (HTTP ${response.status}).`);
    }
    const sourceUrl = response.url || new URL(url, globalThis.location?.href).href;
    // PdfTemplateConfig validates the decoded external configuration before use.
    const definition: unknown = await response.json();
    return new PdfTemplateConfig(definition as PdfTemplateDefinition, sourceUrl);
  }
}
