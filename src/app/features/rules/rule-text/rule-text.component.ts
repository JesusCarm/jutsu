import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Rules } from '../../../core/i18n/i18n-keys';
import type { RuleId } from '../rule-references';
import { ruleTextParts } from '../rule-keywords';

@Component({
  selector: 'app-rule-text', templateUrl: './rule-text.component.html', styleUrl: './rule-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleTextComponent {
  readonly text = input.required<string>();
  readonly exclude = input<RuleId>();
  readonly opensDialog = input(true);
  readonly selectedRule = output<RuleId>();
  protected readonly i18n = inject(I18nService);
  protected readonly Rules = Rules;
  protected readonly parts = computed(() => ruleTextParts(this.text(), this.exclude()));
}
