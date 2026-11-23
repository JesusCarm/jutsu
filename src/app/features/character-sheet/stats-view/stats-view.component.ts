import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import type { StatName } from '../../../core/models/game-types';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import type { IconName } from '../../../shared/ui-icon/ui-icon.component';

@Component({
  selector: 'app-stats-view',
  imports: [UiIconComponent],
  templateUrl: './stats-view.component.html',
  styleUrl: './stats-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsViewComponent {
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
