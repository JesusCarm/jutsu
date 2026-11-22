import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import { NINJA_STATS } from '../../core/models/ninja-options';

@Component({
  selector: 'app-stats-view',
  template: `
    <fieldset class="form-section"><legend>Stats</legend>
      <dl class="stat-fields">
        @for (stat of statNames; track stat) {
          <div class="read-only-field"><dt class="stat-name">{{ stat }}:</dt><dd>{{ stats()[stat] ?? '—' }}</dd></div>
        }
      </dl>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsView {
  readonly stats = input.required<NinjaSnapshot['stats']>();
  protected readonly statNames = NINJA_STATS;
}
