import type { LocalizedBandSnapshot } from '../../core/i18n/game-text';
import type { PdfTemplate } from './pdf-types';

export interface PdfWorkerRequest { readonly band: LocalizedBandSnapshot; readonly template: PdfTemplate; }
export type PdfWorkerResponse = { readonly kind: 'success'; readonly bytes: Uint8Array }
  | { readonly kind: 'error'; readonly message: string };
