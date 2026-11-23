import type { FetchResource, PdfTemplate } from './pdf-types';
import { BandFieldResolver } from './band-field-resolver';
import { BandFormPdfGenerator } from './band-form-pdf-generator';
import { PdfSheetComposer } from './pdf-sheet-composer';

export class BandSheetPdfGenerator {
  constructor(readonly fetchResource: FetchResource, readonly composer = new PdfSheetComposer(),
    readonly resolver = new BandFieldResolver()) {}

  async generate(data: unknown, template: PdfTemplate): Promise<Uint8Array> {
    const layout = template.repeatedSheet;
    if (!layout || !Number.isInteger(layout.count) || layout.count < 1 || template.formOutput !== 'flattened') {
      throw new Error('Repeated sheets require a positive copy count and flattened form output.');
    }
    const ninjas = this.resolver.resolve(data, 'ninjas');
    if (!Array.isArray(ninjas) || ninjas.length !== layout.count || !data || typeof data !== 'object') {
      throw new Error(`The PDF sheet requires exactly ${layout.count} ninjas.`);
    }
    // Every card has its own PDF document, while network resources are fetched once.
    const resources = new Map<string, Promise<Response>>();
    const fetchCached: FetchResource = async (url) => {
      let response = resources.get(url);
      if (!response) { response = this.fetchResource(url); resources.set(url, response); }
      return (await response).clone();
    };
    const generator = new BandFormPdfGenerator(fetchCached);
    const cards: Uint8Array[] = [];
    for (const [index, ninja] of ninjas.entries()) {
      try {
        cards.push(await generator.generate({ ...data, ninjas: [ninja] }, template));
      } catch (error) {
        throw new Error(`Unable to generate ninja ${index + 1}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }
    return this.composer.compose(cards, layout.pageSize);
  }
}
