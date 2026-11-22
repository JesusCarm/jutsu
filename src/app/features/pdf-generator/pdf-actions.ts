import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { PdfGeneration } from './pdf-generation';

@Component({
  selector: 'app-pdf-actions',
  imports: [MatButton],
  template: `
    <div class="builder-actions">
      <p id="pdf-status" role="status" aria-live="polite" [attr.data-state]="pdf.status().phase">{{ pdf.status().message }}</p>
      <button matButton="filled" id="generate-pdf" type="button" [disabled]="pdf.generating()"
        aria-describedby="pdf-status" (click)="pdf.generate()">{{ pdf.generating() ? 'Generating…' : 'Generate PDF' }}</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfActions { protected readonly pdf = inject(PdfGeneration); }
