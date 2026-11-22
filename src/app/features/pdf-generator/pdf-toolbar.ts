import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiIcon } from '../../shared/ui-icon';
import { PdfExport } from './pdf-export';
import { PdfGeneration } from './pdf-generation';

@Component({
  selector: 'app-pdf-toolbar',
  imports: [UiIcon],
  template: `
    <div class="pdf-toolbar" role="group" aria-label="Acciones de la ficha">
      <button class="icon-button" id="generate-pdf" type="button" [disabled]="pdf.generating()"
        title="Generar y descargar PDF" aria-label="Generar y descargar PDF" aria-describedby="pdf-status"
        (click)="exports.generateAndDownload()"><app-ui-icon name="file" /></button>
      <button class="icon-button" id="download-pdf" type="button" [disabled]="!pdf.hasPdf()"
        title="Descargar PDF" aria-label="Descargar PDF" aria-describedby="pdf-status"
        (click)="exports.download()"><app-ui-icon name="download" /></button>
      <button class="icon-button" id="print-pdf" type="button" [disabled]="!pdf.hasPdf()"
        title="Abrir PDF para imprimir" aria-label="Abrir PDF para imprimir" aria-describedby="pdf-status"
        (click)="exports.openForPrinting()"><app-ui-icon name="printer" /></button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfToolbar {
  protected readonly pdf = inject(PdfGeneration);
  protected readonly exports = inject(PdfExport);
}
