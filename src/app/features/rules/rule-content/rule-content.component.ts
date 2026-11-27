import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import type { Language } from '../../../core/i18n/languages';
import type { RuleSection } from '../rule-document';
import type { RuleId } from '../rule-references';
import { RulesService } from '../rules.service';
import { RuleTextComponent } from '../rule-text/rule-text.component';

@Component({
  selector: 'app-rule-content', imports: [RuleTextComponent],
  templateUrl: './rule-content.component.html', styleUrl: './rule-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleContentComponent {
  readonly section = input.required<RuleSection>();
  readonly current = input.required<RuleId>();
  readonly language = input.required<Language>();
  readonly opensDialog = input(false);
  readonly selectedRule = output<RuleId>();
  protected readonly rules = inject(RulesService);
}
