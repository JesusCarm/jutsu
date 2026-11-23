import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { EquipmentDefinition, EquipmentKind } from '../../core/models/game-types';
import { UiIcon } from '../../shared/ui-icon';
import { BandState } from './band-state';
import { CatalogSelect } from './catalog-select';
import { EquipmentPresentation } from './equipment-presentation';

@Component({
  selector: 'app-equipment-list-editor',
  imports: [CatalogSelect, UiIcon],
  template: `
    <fieldset class="equipment-editor form-section">
      <legend><app-ui-icon [name]="kind() === 'weapons' ? 'weapons' : 'equipment'" />{{ kind() === 'weapons' ? 'Armas' : 'Objetos' }}</legend>
      <div class="equipment-list">
        @for (slot of slots(); track slot.index) {
          <div class="equipment-row">
            <app-ui-icon [name]="slot.icon" [title]="slot.name || emptyLabel()" />
            <app-catalog-select [label]="(kind() === 'weapons' ? 'Arma ' : 'Objeto ') + (slot.index + 1)"
              [hideLabel]="true" [placeholder]="emptyLabel()" [controlId]="controlId(slot.index)"
              [value]="slot.name" [options]="options()" [describedBy]="slot.name ? controlId(slot.index) + '-details' : ''"
              (selected)="state.selectEquipmentSlot(ninjaIndex(), kind(), slot.index, $event)" />
            @if (slot.name) {
              <span class="sr-only" [id]="controlId(slot.index) + '-details'">{{ slot.description }} {{ slot.cost }}</span>
            }
          </div>
        }
      </div>
      @if (hasEquipment()) {
        <details class="equipment-details">
          <summary>Ver efectos del equipo</summary>
          @for (slot of slots(); track slot.index) {
            @if (slot.name) {
              <div class="equipment-effect"><strong>{{ slot.name }}</strong><span class="action-cost">{{ slot.cost }}</span><p>{{ slot.description }}</p></div>
            }
          }
        </details>
      }
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentListEditor {
  readonly kind = input.required<EquipmentKind>();
  readonly entries = input.required<readonly EquipmentDefinition[]>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandState);
  private readonly presentation = new EquipmentPresentation();
  protected readonly slots = computed(() => this.presentation.slots(this.kind(), this.entries()));
  protected readonly hasEquipment = computed(() => this.entries().some((entry) => entry.name));
  protected readonly options = computed(() => this.state.catalog.getEquipment(this.kind()));
  protected readonly emptyLabel = computed(() => this.kind() === 'weapons' ? 'Sin arma' : 'Sin objeto');

  protected controlId(index: number): string {
    return `ninja-${this.ninjaIndex() + 1}-${this.kind() === 'weapons' ? 'weapon' : 'item'}-${index + 1}-name`;
  }
}
