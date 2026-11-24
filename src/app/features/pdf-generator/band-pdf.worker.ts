import { BandPdfGenerator } from './band-pdf-generator';
import type { PdfWorkerRequest, PdfWorkerResponse } from './pdf-worker-messages';

const worker: DedicatedWorkerGlobalScope = self;

worker.addEventListener('message', async ({ data }: MessageEvent<PdfWorkerRequest>) => {
  try {
    const bytes = await new BandPdfGenerator().generate(data.band, data.template);
    const response: PdfWorkerResponse = { kind: 'success', bytes };
    worker.postMessage(response, [bytes.buffer]);
  } catch (error: unknown) {
    const response: PdfWorkerResponse = { kind: 'error', message: error instanceof Error ? error.message : String(error) };
    worker.postMessage(response);
  }
});
