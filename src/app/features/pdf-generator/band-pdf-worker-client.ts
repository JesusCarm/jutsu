import type { LocalizedBandSnapshot } from '../../core/i18n/game-text';
import { Messages } from '../../core/i18n/i18n-keys';
import { TranslationError } from '../../core/i18n/translation-error';
import type { PdfTemplate } from './pdf-types';
import type { PdfWorkerRequest } from './pdf-worker-messages';

export type PdfWorkerConnection = Pick<Worker, 'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'>;

/** Runs one generation outside the page and releases the worker after success or failure. */
export class BandPdfWorkerClient {
  constructor(private readonly createWorker: () => PdfWorkerConnection = () => {
    if (typeof Worker === 'undefined') throw new TranslationError(Messages.pdfWorkerUnavailable);
    return new Worker(new URL('./band-pdf.worker', import.meta.url), { type: 'module' });
  }) {}

  async generate(band: LocalizedBandSnapshot, template: PdfTemplate): Promise<Uint8Array> {
    const worker = this.createWorker();
    try {
      return await new Promise<Uint8Array>((resolve, reject) => {
        worker.onmessage = (event) => {
          const response: unknown = event.data;
          if (response && typeof response === 'object' && 'kind' in response) {
            if (response.kind === 'success' && 'bytes' in response && response.bytes instanceof Uint8Array) {
              resolve(response.bytes);
              return;
            }
            if (response.kind === 'error' && 'message' in response && typeof response.message === 'string') {
              reject(new Error(response.message));
              return;
            }
          }
          reject(new TranslationError(Messages.pdfWorkerFailed));
        };
        worker.onerror = (event) => {
          event.preventDefault();
          reject(event.message ? new Error(event.message) : new TranslationError(Messages.pdfWorkerFailed));
        };
        worker.onmessageerror = () => reject(new TranslationError(Messages.pdfWorkerFailed));
        const request: PdfWorkerRequest = { band, template };
        worker.postMessage(request);
      });
    } finally {
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    }
  }
}
