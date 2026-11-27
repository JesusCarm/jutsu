import type { TranslationKey } from '../../../core/i18n/i18n-keys';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Stats, ShortStats } from '../../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import type { StatName } from '../../../core/models/game-types';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import type { IconName } from '../../../shared/ui-icon/ui-icon.component';
import { RuleHelpComponent } from '../../rules/rule-help/rule-help.component';
import { STAT_RULES } from '../../rules/rule-references';

@Component({
  selector: 'app-stats-view',
  imports: [UiIconComponent, RuleHelpComponent],
  templateUrl: './stats-view.component.html',
  styleUrl: './stats-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsViewComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly Stats = Stats;
  protected readonly ShortStats = ShortStats;

  readonly stats = input.required<NinjaSnapshot['stats']>();
  readonly showLabels = input(false);
  readonly showHelp = input(true);
  protected readonly statRules = STAT_RULES;
  protected readonly fields: readonly { key: StatName; label: TranslationKey; short: TranslationKey; icon: IconName }[] = [
    { key: 'chakra', label: Stats.chakra, short: ShortStats.chakra, icon: 'chakra' },
    { key: 'attack', label: Stats.attack, short: ShortStats.attack, icon: 'attack' },
    { key: 'defense', label: Stats.defense, short: ShortStats.defense, icon: 'defense' },
    { key: 'movement', label: Stats.movement, short: ShortStats.movement, icon: 'movement' },
    { key: 'skill', label: Stats.skill, short: ShortStats.skill, icon: 'skill' },
    { key: 'health', label: Stats.health, short: ShortStats.health, icon: 'health' },
  ];
}
