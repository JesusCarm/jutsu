import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Actions } from '../../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { PdfExportService } from '../pdf-export.service';
import { PdfGenerationService } from '../pdf-generation.service';

@Component({
  selector: 'app-pdf-toolbar',
  imports: [UiIconComponent],
  templateUrl: './pdf-toolbar.component.html',
  styleUrl: './pdf-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfToolbarComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly Actions = Actions;

  protected readonly pdf = inject(PdfGenerationService);
  protected readonly exports = inject(PdfExportService);
}
