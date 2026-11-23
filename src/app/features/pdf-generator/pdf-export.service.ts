import { computed, inject, Injectable, linkedSignal } from '@angular/core';
import { BandStateService } from '../character-sheet/band-state.service';
import { PdfBrowserFilesService } from './pdf-browser-files.service';
import { PdfFileName } from './pdf-file-name';
import { PdfGenerationService } from './pdf-generation.service';

interface ExportNotice { phase: 'success' | 'error'; message: string; }

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private readonly band = inject(BandStateService);
  private readonly generation = inject(PdfGenerationService);
  private readonly files = inject(PdfBrowserFilesService);
  private readonly names = new PdfFileName();
  private readonly notice = linkedSignal<ExportNotice | null>(() => {
    this.generation.status();
    return null;
  });
  readonly fileName = computed(() => this.names.fromBandName(this.band.band().name));
  readonly status = computed(() => this.notice() ?? this.generation.status());

  async generateAndDownload(): Promise<void> {
    if (this.generation.generating()) return;
    await this.generation.generate();
    if (this.generation.hasPdf()) this.download();
  }

  download(): void {
    this.run((bytes) => this.files.download(bytes, this.fileName()), 'Download started.');
  }

  openForPrinting(): void {
    this.run((bytes) => this.files.openForPrinting(bytes), 'PDF opened in a new tab. Use the PDF viewer’s print controls.');
  }

  private run(action: (bytes: Uint8Array) => void, message: string): void {
    const bytes = this.generation.getPdfBytes();
    if (!bytes) {
      this.notice.set({ phase: 'error', message: 'Generate your sheet before downloading or printing.' });
      return;
    }
    try {
      action(bytes);
      this.notice.set({ phase: 'success', message });
    } catch (error: unknown) {
      this.notice.set({ phase: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }
}
