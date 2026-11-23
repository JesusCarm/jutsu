import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { PdfGenerationService } from '../pdf-generation.service';
import { PdfExportService } from '../pdf-export.service';
import { PdfTemplateSelectComponent } from '../pdf-template-select/pdf-template-select.component';

@Component({
  selector: 'app-pdf-actions',
  imports: [UiIconComponent, PdfTemplateSelectComponent],
  templateUrl: './pdf-actions.component.html',
  styleUrl: './pdf-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfActionsComponent {
  protected readonly pdf = inject(PdfGenerationService);
  protected readonly exports = inject(PdfExportService);
}
