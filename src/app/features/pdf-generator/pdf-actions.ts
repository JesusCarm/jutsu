import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiIcon } from '../../shared/ui-icon';
import { PdfGeneration } from './pdf-generation';
import { PdfExport } from './pdf-export';
import { PdfTemplateSelect } from './pdf-template-select';

@Component({
  selector: 'app-pdf-actions',
  imports: [UiIcon, PdfTemplateSelect],
  template: `
    <div class="builder-actions">
      <app-pdf-template-select />
      <button class="primary-button" id="generate-pdf-bottom" type="button" [disabled]="pdf.generating()"
        aria-describedby="pdf-status" (click)="exports.generateAndDownload()"><app-ui-icon name="download" />{{ pdf.generating() ? 'Generando…' : 'Generar y descargar PDF' }}</button>
      <div class="pdf-messages">
        <p id="pdf-status" role="status" aria-live="polite" [attr.data-state]="exports.status().phase">{{ exports.status().message }}</p>
        @if (pdf.hasPdf()) { <p class="pdf-file-name">{{ exports.fileName() }}</p> }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfActions {
  protected readonly pdf = inject(PdfGeneration);
  protected readonly exports = inject(PdfExport);
}
