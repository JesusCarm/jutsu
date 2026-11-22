import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { PdfGeneration } from './pdf-generation';
import { PdfExport } from './pdf-export';
import { PdfTemplateSelect } from './pdf-template-select';

@Component({
  selector: 'app-pdf-actions',
  imports: [MatButton, PdfTemplateSelect],
  template: `
    <div class="pdf-template-controls"><app-pdf-template-select /></div>
    <div class="builder-actions">
      <div class="pdf-messages">
        <p id="pdf-status" role="status" aria-live="polite" [attr.data-state]="exports.status().phase">{{ exports.status().message }}</p>
        @if (pdf.hasPdf()) { <p class="pdf-file-name">{{ exports.fileName() }}</p> }
      </div>
      <div class="pdf-buttons">
        <button matButton="filled" id="generate-pdf" type="button" [disabled]="pdf.generating()"
          aria-describedby="pdf-status" (click)="exports.generateAndDownload()">{{ pdf.generating() ? 'Generating…' : 'Generate PDF' }}</button>
        <button matButton="outlined" id="download-pdf" type="button" [disabled]="!pdf.hasPdf()"
          aria-describedby="pdf-status" (click)="exports.download()">Download PDF</button>
        <button matButton="outlined" id="print-pdf" type="button" [disabled]="!pdf.hasPdf()"
          aria-describedby="pdf-status" (click)="exports.openForPrinting()">Open PDF to print</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfActions {
  protected readonly pdf = inject(PdfGeneration);
  protected readonly exports = inject(PdfExport);
}
