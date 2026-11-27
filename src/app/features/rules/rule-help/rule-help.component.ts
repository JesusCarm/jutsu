import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Rules } from '../../../core/i18n/i18n-keys';
import { UiIconComponent, type IconName } from '../../../shared/ui-icon/ui-icon.component';
import type { RuleId } from '../rule-references';
import { RuleDialogsService } from '../rule-dialogs.service';

@Component({
  selector: 'app-rule-help', imports: [UiIconComponent],
  templateUrl: './rule-help.component.html', styleUrl: './rule-help.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleHelpComponent {
  readonly rule = input.required<RuleId | 'overview'>();
  readonly label = input.required<string>();
  readonly icon = input<IconName>('help');
  readonly showLabel = input(false);
  protected readonly i18n = inject(I18nService);
  protected readonly Rules = Rules;
  protected readonly dialogs = inject(RuleDialogsService);

  protected open(): void {
    const rule = this.rule();
    if (rule === 'overview') this.dialogs.openOverview();
    else this.dialogs.open(rule);
  }
}
