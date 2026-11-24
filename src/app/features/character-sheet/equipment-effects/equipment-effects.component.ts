import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Actions } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { EquipmentPresentation } from '../equipment-presentation';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';

@Component({
  selector: 'app-equipment-effects', imports: [UiIconComponent],
  templateUrl: './equipment-effects.component.html', styleUrl: './equipment-effects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentEffectsComponent {
  readonly equipment = input.required<NinjaSnapshot['equipment']>();
  readonly expanded = input(false);
  protected readonly i18n = inject(I18nService);
  protected readonly Actions = Actions;
  private readonly text = inject(GameTextService);
  private readonly presentation = new EquipmentPresentation();
  protected readonly groups = computed(() => (['weapons', 'items'] as const).map((kind) => ({
    kind, label: this.i18n.t(kind === 'weapons' ? Labels.weapons : Labels.items),
    slots: this.presentation.slots(kind, this.equipment()[kind], this.text.snapshot()).filter((slot) => slot.id),
  })).filter((group) => group.slots.length));
}
