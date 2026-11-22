import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import { EquipmentSummary } from './equipment-summary';
import { NinjaLabels } from './ninja-labels';
import { StatsView } from './stats-view';

@Component({
  selector: 'app-ninja-summary',
  imports: [StatsView, EquipmentSummary],
  template: `
    <div class="ninja-summary" [class.is-active]="active()" (click)="select()">
      <div [id]="'ninja-' + (index() + 1) + '-title'">
        <button type="button" class="ninja-select" [id]="'ninja-' + (index() + 1) + '-select'"
          [attr.aria-pressed]="active()" [attr.aria-controls]="'ninja-' + (index() + 1) + '-panel'"
          [attr.aria-label]="'Editar ' + (ninja().name || 'Ninja ' + (index() + 1))">
          <span class="ninja-name">{{ ninja().name || 'Ninja ' + (index() + 1) }}</span>
          <span class="ninja-type">{{ labels.type(ninja().type) || 'Sin tipo' }}</span>
        </button>
        <h2 class="ninja-static-heading">
          <span class="ninja-name">{{ ninja().name || 'Ninja ' + (index() + 1) }}</span>
          <span class="ninja-type">{{ labels.type(ninja().type) || 'Sin tipo' }}</span>
        </h2>
      </div>
      <app-stats-view [stats]="ninja().stats" />
      <app-equipment-summary [equipment]="ninja().equipment" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaSummary {
  readonly ninja = input.required<NinjaSnapshot>();
  readonly index = input.required<number>();
  readonly active = input(false);
  readonly selected = output<void>();
  protected readonly labels = new NinjaLabels();

  protected select(): void {
    if (globalThis.matchMedia?.('(min-width: 56rem)').matches) return;
    this.selected.emit();
  }
}
