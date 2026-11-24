import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Actions } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import type { EquipmentKind } from '../../../core/models/game-types';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { EquipmentPresentation } from '../equipment-presentation';
import { NinjaSelectionService } from '../ninja-selection.service';

@Component({
  selector: 'app-equipment-summary', imports: [UiIconComponent],
  templateUrl: './equipment-summary.component.html', styleUrl: './equipment-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentSummaryComponent {
  readonly equipment = input.required<NinjaSnapshot['equipment']>();
  readonly ninjaIndex = input.required<number>();
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly selections = inject(NinjaSelectionService);
  private readonly text = inject(GameTextService);
  private readonly presentation = new EquipmentPresentation();
  protected readonly groups = computed(() => (['weapons', 'items'] as const).map((kind) => ({
    kind, label: this.i18n.t(kind === 'weapons' ? Labels.weapons : Labels.items),
    empty: this.i18n.t(kind === 'weapons' ? Labels.noWeapon : Labels.noItem),
    slots: this.presentation.slots(kind, this.equipment()[kind], this.text.snapshot()),
  })));

  protected slotLabel(kind: EquipmentKind, index: number, name: string): string {
    const slot = this.i18n.t(kind === 'weapons' ? Actions.chooseWeapon : Actions.chooseItem, { number: index + 1 });
    return name ? this.i18n.t(Labels.equipmentSlot, { slot, name }) : slot;
  }
}
