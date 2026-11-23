import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { EquipmentSummaryComponent } from '../equipment-summary/equipment-summary.component';
import { NinjaLabels } from '../ninja-labels';
import { StatsViewComponent } from '../stats-view/stats-view.component';

@Component({
  selector: 'app-ninja-summary',
  imports: [StatsViewComponent, EquipmentSummaryComponent],
  templateUrl: './ninja-summary.component.html',
  styleUrl: './ninja-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaSummaryComponent {
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
