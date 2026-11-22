import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import type { BandSnapshot } from '../../core/models/band-snapshot';
import { PlatformAssets } from '../../core/services/platform-assets';
import { BandState } from '../character-sheet/band-state';

export type GenerateBandPdf = (band: BandSnapshot) => Promise<Uint8Array>;
export const GENERATE_BAND_PDF = new InjectionToken<GenerateBandPdf>('Generate a local band PDF', {
  providedIn: 'root',
  factory: () => {
    const assets = inject(PlatformAssets);
    return async (band) => {
      const [{ BandPdfGenerator }, { JutsuPdfTemplate }] = await Promise.all([
        import('./band-pdf-generator'), import('./jutsu-pdf-template'),
      ]);
      return new BandPdfGenerator().generate(band, new JutsuPdfTemplate(assets.baseUrl));
    };
  },
});

type Phase = 'idle' | 'loading' | 'success' | 'error';
interface GenerationResult { revision: number; phase: Phase; message: string; bytes: Uint8Array | null; }
const READY = 'Ready to generate your sheet.';

@Injectable({ providedIn: 'root' })
export class PdfGeneration {
  private readonly state = inject(BandState);
  private readonly generatePdf = inject(GENERATE_BAND_PDF);
  private readonly result = signal<GenerationResult>({ revision: 0, phase: 'idle', message: READY, bytes: null });
  readonly generating = computed(() => this.result().phase === 'loading');
  readonly status = computed(() => {
    const result = this.result();
    return result.phase === 'loading' || result.revision === this.state.revision()
      ? { phase: result.phase, message: result.message }
      : { phase: 'idle' as const, message: READY };
  });

  getPdfBytes(): Uint8Array | null {
    const result = this.result();
    return result.revision === this.state.revision() ? result.bytes?.slice() ?? null : null;
  }

  async generate(): Promise<void> {
    if (this.generating()) return;
    const revision = this.state.revision();
    const snapshot = structuredClone(this.state.band());
    this.result.set({ revision, phase: 'loading', message: 'Generating your sheet…', bytes: null });
    try {
      const bytes = await this.generatePdf(snapshot);
      if (!(bytes instanceof Uint8Array)) throw new TypeError('The generator must return PDF bytes.');
      this.result.set(revision === this.state.revision()
        ? { revision, phase: 'success', message: 'PDF generated successfully.', bytes }
        : { revision: this.state.revision(), phase: 'idle', message: 'Your squad changed. Generate your sheet again.', bytes: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.result.set({ revision: this.state.revision(), phase: 'error', message: `Could not generate the PDF. ${message}`, bytes: null });
    }
  }
}
