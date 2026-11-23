import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { EquipmentPresentation } from '../equipment-presentation';

@Component({
  selector: 'app-equipment-summary',
  imports: [UiIconComponent],
  templateUrl: './equipment-summary.component.html',
  styleUrl: './equipment-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentSummaryComponent {
  readonly equipment = input.required<NinjaSnapshot['equipment']>();
  private readonly presentation = new EquipmentPresentation();
  protected readonly groups = computed(() => [
    { kind: 'weapons', label: 'Armas', empty: 'Sin arma', slots: this.presentation.slots('weapons', this.equipment().weapons) },
    { kind: 'items', label: 'Objetos', empty: 'Sin objeto', slots: this.presentation.slots('items', this.equipment().items) },
  ]);
}
