import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { I18nService } from '../../core/i18n/i18n.service';
import { Actions } from '../../core/i18n/i18n-keys';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-selection-panel', imports: [UiIconComponent],
  templateUrl: './selection-panel.component.html', styleUrl: './selection-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionPanelComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  protected readonly dialog = inject(DialogRef);
  protected readonly i18n = inject(I18nService);
  protected readonly Actions = Actions;
}
