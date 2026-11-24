import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import { ChangeDetectionStrategy, Component, inject, computed, input } from '@angular/core';
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
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly text = inject(GameTextService);

  readonly equipment = input.required<NinjaSnapshot['equipment']>();
  private readonly presentation = new EquipmentPresentation();
  protected readonly groups = computed(() => [
    { kind: 'weapons', label: this.i18n.t(Labels.weapons), empty: this.i18n.t(Labels.noWeapon), slots: this.presentation.slots('weapons', this.equipment().weapons, this.text.snapshot()) },
    { kind: 'items', label: this.i18n.t(Labels.items), empty: this.i18n.t(Labels.noItem), slots: this.presentation.slots('items', this.equipment().items, this.text.snapshot()) },
  ]);
}
