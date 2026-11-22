import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import type { BandSnapshot } from '../../core/models/band-snapshot';
import { BandState } from '../character-sheet/band-state';
import { PdfTemplates } from './pdf-templates';
import type { PdfTemplate } from './pdf-types';

export type GenerateBandPdf = (band: BandSnapshot, template: PdfTemplate) => Promise<Uint8Array>;
export const GENERATE_BAND_PDF = new InjectionToken<GenerateBandPdf>('Generate a local band PDF', {
  providedIn: 'root',
  factory: () => {
    return async (band, template) => {
      const { BandPdfGenerator } = await import('./band-pdf-generator');
      return new BandPdfGenerator().generate(band, template);
    };
  },
});

type Phase = 'idle' | 'loading' | 'success' | 'error';
interface GenerationContext { revision: number; templateRevision: number; }
interface GenerationResult extends GenerationContext { phase: Phase; message: string; bytes: Uint8Array | null; }
const READY = 'Ready to generate your sheet.';

@Injectable({ providedIn: 'root' })
export class PdfGeneration {
  private readonly state = inject(BandState);
  private readonly templates = inject(PdfTemplates);
  private readonly generatePdf = inject(GENERATE_BAND_PDF);
  private readonly result = signal<GenerationResult>({ revision: 0, templateRevision: this.templates.revision(), phase: 'idle', message: READY, bytes: null });
  readonly generating = computed(() => this.result().phase === 'loading');
  readonly hasPdf = computed(() => this.isCurrent(this.result()) && this.result().bytes !== null);
  readonly status = computed(() => {
    const result = this.result();
    return result.phase === 'loading' || this.isCurrent(result)
      ? { phase: result.phase, message: result.message }
      : { phase: 'idle' as const, message: READY };
  });

  getPdfBytes(): Uint8Array | null {
    const result = this.result();
    return this.isCurrent(result) ? result.bytes?.slice() ?? null : null;
  }

  async generate(): Promise<void> {
    if (this.generating()) return;
    const context = { revision: this.state.revision(), templateRevision: this.templates.revision() };
    const template = this.templates.getTemplate(this.templates.selectedId());
    const snapshot = structuredClone(this.state.band());
    this.result.set({ ...context, phase: 'loading', message: 'Generating your sheet…', bytes: null });
    try {
      const bytes = await this.generatePdf(snapshot, template);
      if (!(bytes instanceof Uint8Array)) throw new TypeError('The generator must return PDF bytes.');
      this.result.set(this.isCurrent(context)
        ? { ...context, phase: 'success', message: 'PDF generated successfully.', bytes }
        : this.obsoleteResult());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.result.set(this.isCurrent(context)
        ? { ...context, phase: 'error', message: `Could not generate the PDF. ${message}`, bytes: null }
        : this.obsoleteResult());
    }
  }

  private isCurrent(result: GenerationContext): boolean {
    return result.revision === this.state.revision() && result.templateRevision === this.templates.revision();
  }

  private obsoleteResult(): GenerationResult {
    return { revision: this.state.revision(), templateRevision: this.templates.revision(), phase: 'idle',
      message: 'Your squad changed or a different template was selected. Generate your sheet again.', bytes: null };
  }
}
