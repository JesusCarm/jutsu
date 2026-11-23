import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import type { StatName } from '../../core/models/game-types';
import { UiIcon } from '../../shared/ui-icon';
import type { IconName } from '../../shared/ui-icon';

@Component({
  selector: 'app-stats-view',
  imports: [UiIcon],
  template: `
    <dl class="stat-fields" aria-label="Estadísticas">
      @for (stat of fields; track stat.key) {
        <div class="mini-stat" [attr.data-stat]="stat.key" [title]="stat.label">
          <dt><app-ui-icon [name]="stat.icon" /><span class="sr-only">{{ stat.label }}</span></dt>
          <dd><span class="stat-value">{{ stats()[stat.key] ?? '—' }}</span><span class="stat-caption" aria-hidden="true">{{ stat.short }}</span></dd>
        </div>
      }
    </dl>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsView {
  readonly stats = input.required<NinjaSnapshot['stats']>();
  protected readonly fields: readonly { key: StatName; label: string; short: string; icon: IconName }[] = [
    { key: 'chakra', label: 'Chakra', short: 'CHK', icon: 'chakra' },
    { key: 'attack', label: 'Ataque', short: 'ATQ', icon: 'attack' },
    { key: 'defense', label: 'Defensa', short: 'DEF', icon: 'defense' },
    { key: 'movement', label: 'Movimiento', short: 'MOV', icon: 'movement' },
    { key: 'skill', label: 'Habilidad', short: 'HAB', icon: 'skill' },
    { key: 'health', label: 'Vida', short: 'VID', icon: 'health' },
  ];
}
