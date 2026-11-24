import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Actions } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
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
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly Actions = Actions;
  protected readonly text = inject(GameTextService);

  readonly kind = input.required<EquipmentKind>();
  readonly entries = input.required<readonly EquipmentDefinition[]>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandStateService);
  private readonly presentation = new EquipmentPresentation();
  protected readonly slots = computed(() => this.presentation.slots(this.kind(), this.entries(), this.text.snapshot()));
  protected readonly hasEquipment = computed(() => this.entries().some((entry) => entry.id));
  protected readonly options = computed(() => this.state.catalog.getEquipment(this.kind()).map((entry) => ({ id: entry.id, label: this.text.equipment(entry).name })));
  protected readonly emptyLabel = computed(() => this.i18n.t(this.kind() === 'weapons' ? Labels.noWeapon : Labels.noItem));

  protected controlId(index: number): string {
    return `ninja-${this.ninjaIndex() + 1}-${this.kind() === 'weapons' ? 'weapon' : 'item'}-${index + 1}-name`;
  }
}
