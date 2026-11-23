import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import { UiIcon } from '../../shared/ui-icon';
import { EquipmentPresentation } from './equipment-presentation';

@Component({
  selector: 'app-equipment-summary',
  imports: [UiIcon],
  template: `
    <div class="mini-inventory" aria-label="Equipo">
      @for (group of groups(); track group.kind) {
        <div class="mini-inventory-group" [attr.aria-label]="group.label">
          <app-ui-icon class="inventory-category" [name]="group.kind === 'weapons' ? 'weapons' : 'equipment'" />
          @for (slot of group.slots; track slot.index) {
            <span class="equipment-token" [class.is-empty]="!slot.name" [attr.data-equipment]="slot.name"
              [title]="slot.name || group.empty" role="img" [attr.aria-label]="slot.name || group.empty">
              <app-ui-icon [name]="slot.icon" />
            </span>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentSummary {
  readonly equipment = input.required<NinjaSnapshot['equipment']>();
  private readonly presentation = new EquipmentPresentation();
  protected readonly groups = computed(() => [
    { kind: 'weapons', label: 'Armas', empty: 'Sin arma', slots: this.presentation.slots('weapons', this.equipment().weapons) },
    { kind: 'items', label: 'Objetos', empty: 'Sin objeto', slots: this.presentation.slots('items', this.equipment().items) },
  ]);
}
