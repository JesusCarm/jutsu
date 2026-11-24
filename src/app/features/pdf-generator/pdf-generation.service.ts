import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import type { LocalizedBandSnapshot } from '../../core/i18n/game-text';
import { GameTextService } from '../../core/i18n/game-text.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Messages } from '../../core/i18n/i18n-keys';
import type { TranslationMessage } from '../../core/i18n/translation-dictionary';
import { TranslationError } from '../../core/i18n/translation-error';
import { BandStateService } from '../character-sheet/band-state.service';
import { PdfTemplatesService } from './pdf-templates.service';
import type { PdfTemplate } from './pdf-types';

export type GenerateBandPdf = (band: LocalizedBandSnapshot, template: PdfTemplate) => Promise<Uint8Array>;
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
interface GenerationContext { revision: number; templateRevision: number; languageRevision: number; }
interface GenerationResult extends GenerationContext { phase: Phase; message: TranslationMessage; bytes: Uint8Array | null; }

@Injectable({ providedIn: 'root' })
export class PdfGenerationService {
  private readonly state = inject(BandStateService);
  private readonly templates = inject(PdfTemplatesService);
  private readonly generatePdf = inject(GENERATE_BAND_PDF);
  private readonly i18n = inject(I18nService);
  private readonly text = inject(GameTextService);
  private readonly result = signal<GenerationResult>({ ...this.context(), phase: 'idle', message: { key: Messages.ready }, bytes: null });
  readonly generating = computed(() => this.result().phase === 'loading');
  readonly hasPdf = computed(() => !this.i18n.loading() && this.isCurrent(this.result()) && this.result().bytes !== null);
  readonly status = computed(() => {
    const result = this.result();
    return result.phase === 'loading' || this.isCurrent(result)
      ? { phase: result.phase, message: this.i18n.t(result.message.key, result.message.params) }
      : { phase: 'idle' as const, message: this.i18n.t(Messages.ready) };
  });

  getPdfBytes(): Uint8Array | null {
    const result = this.result();
    return this.isCurrent(result) ? result.bytes?.slice() ?? null : null;
  }

  async generate(): Promise<void> {
    if (this.generating() || this.i18n.loading()) return;
    const context = this.context();
    // Capture translations once: no Angular services or live language state enter the engine.
    const snapshot = this.text.snapshot().band(this.state.band());
    this.result.set({ ...context, phase: 'loading', message: { key: Messages.loading }, bytes: null });
    try {
      const template = this.templates.getTemplate(this.templates.selectedId(), this.i18n.lang());
      const bytes = await this.generatePdf(snapshot, template);
      if (!(bytes instanceof Uint8Array)) throw new TranslationError(Messages.invalidPdfBytes);
      this.result.set(this.isCurrent(context)
        ? { ...context, phase: 'success', message: { key: Messages.generated }, bytes }
        : this.obsoleteResult());
    } catch (error: unknown) {
      const message = error instanceof TranslationError ? this.i18n.t(error.key) : error instanceof Error ? error.message : String(error);
      this.result.set(this.isCurrent(context)
        ? { ...context, phase: 'error', message: { key: Messages.failed, params: { message } }, bytes: null }
        : this.obsoleteResult());
    }
  }

  private isCurrent(result: GenerationContext): boolean {
    return result.revision === this.state.revision() && result.templateRevision === this.templates.revision()
      && result.languageRevision === this.i18n.revision();
  }

  private context(): GenerationContext {
    return { revision: this.state.revision(), templateRevision: this.templates.revision(), languageRevision: this.i18n.revision() };
  }

  private obsoleteResult(): GenerationResult {
    return { ...this.context(), phase: 'idle', message: { key: Messages.obsolete }, bytes: null };
  }
}
