import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Stats } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import type { TechniqueDefinition } from '../../../core/models/game-types';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { RuleHelpComponent } from '../../rules/rule-help/rule-help.component';
import { RuleTextComponent } from '../../rules/rule-text/rule-text.component';
import { RuleDialogsService } from '../../rules/rule-dialogs.service';
import { TECHNIQUE_RULES } from '../../rules/rule-references';

@Component({
  selector: 'app-technique-list', imports: [UiIconComponent, RuleHelpComponent, RuleTextComponent],
  templateUrl: './technique-list.component.html', styleUrl: './technique-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechniqueListComponent {
  readonly definitions = input.required<readonly TechniqueDefinition[]>();
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly Stats = Stats;
  private readonly text = inject(GameTextService);
  protected readonly rules = inject(RuleDialogsService);
  protected readonly techniques = computed(() => this.definitions().map((definition) => ({
    ...this.text.technique(definition), rule: TECHNIQUE_RULES[definition.id],
  })));
}
