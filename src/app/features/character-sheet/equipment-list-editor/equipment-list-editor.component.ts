import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { EquipmentDefinition, EquipmentKind } from '../../../core/models/game-types';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { BandStateService } from '../band-state.service';
import { CatalogSelectComponent } from '../catalog-select/catalog-select.component';
import { EquipmentPresentation } from '../equipment-presentation';

@Component({
  selector: 'app-equipment-list-editor',
  imports: [CatalogSelectComponent, UiIconComponent],
  templateUrl: './equipment-list-editor.component.html',
  styleUrl: './equipment-list-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentListEditorComponent {
  readonly kind = input.required<EquipmentKind>();
  readonly entries = input.required<readonly EquipmentDefinition[]>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandStateService);
  private readonly presentation = new EquipmentPresentation();
  protected readonly slots = computed(() => this.presentation.slots(this.kind(), this.entries()));
  protected readonly hasEquipment = computed(() => this.entries().some((entry) => entry.name));
  protected readonly options = computed(() => this.state.catalog.getEquipment(this.kind()));
  protected readonly emptyLabel = computed(() => this.kind() === 'weapons' ? 'No weapon' : 'No item');

  protected controlId(index: number): string {
    return `ninja-${this.ninjaIndex() + 1}-${this.kind() === 'weapons' ? 'weapon' : 'item'}-${index + 1}-name`;
  }
}
