import { computed, inject, Injectable, linkedSignal } from '@angular/core';
import { BandStateService } from '../character-sheet/band-state.service';
import { PdfBrowserFilesService } from './pdf-browser-files.service';
import type { PendingPdfViewer } from './pdf-browser-files.service';
import { PdfFileName } from './pdf-file-name';
import { PdfGenerationService } from './pdf-generation.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Messages, type TranslationKey } from '../../core/i18n/i18n-keys';
import type { TranslationMessage } from '../../core/i18n/translation-dictionary';
import { TranslationError } from '../../core/i18n/translation-error';

interface ExportNotice { phase: 'success' | 'error'; message: TranslationMessage; }

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private readonly band = inject(BandStateService);
  private readonly generation = inject(PdfGenerationService);
  private readonly files = inject(PdfBrowserFilesService);
  private readonly i18n = inject(I18nService);
  private readonly names = new PdfFileName();
  private readonly notice = linkedSignal<ExportNotice | null>(() => {
    this.generation.status();
    return null;
  });
  readonly fileName = computed(() => this.names.fromBandName(this.band.band().name));
  readonly status = computed(() => {
    const notice = this.notice();
    return notice ? { phase: notice.phase, message: this.i18n.t(notice.message.key, notice.message.params) } : this.generation.status();
  });

  async generateAndDownload(): Promise<void> {
    if (this.generation.generating()) return;
    await this.generation.generate();
    if (this.generation.hasPdf()) this.download();
  }

  download(): void {
    this.run((bytes) => this.files.download(bytes, this.fileName()), Messages.downloadStarted);
  }

  openForPrinting(): void {
    this.run((bytes) => this.files.openForPrinting(bytes), Messages.pdfOpened);
  }

  async generateAndOpenForPrinting(): Promise<void> {
    if (this.generation.generating() || this.i18n.loading()) return;
    let viewer: PendingPdfViewer | undefined;
    try {
      viewer = this.files.prepareForPrinting(this.i18n.t(Messages.loading));
      await this.generation.generate();
      const bytes = this.generation.getPdfBytes();
      if (!bytes) {
        viewer.close();
        return;
      }
      viewer.show(bytes);
      this.notice.set({ phase: 'success', message: { key: Messages.pdfOpened } });
    } catch (error: unknown) {
      viewer?.close();
      this.reportError(error);
    }
  }

  private run(action: (bytes: Uint8Array) => void, key: TranslationKey): void {
    const bytes = this.generation.getPdfBytes();
    if (!bytes) {
      this.notice.set({ phase: 'error', message: { key: Messages.generateFirst } });
      return;
    }
    try {
      action(bytes);
      this.notice.set({ phase: 'success', message: { key } });
    } catch (error: unknown) {
      this.reportError(error);
    }
  }

  private reportError(error: unknown): void {
    this.notice.set({ phase: 'error', message: error instanceof TranslationError ? { key: error.key }
      : { key: Messages.exportFailed, params: { message: error instanceof Error ? error.message : String(error) } } });
  }
}
