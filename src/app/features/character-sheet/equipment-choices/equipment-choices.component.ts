import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import type { EquipmentKind } from '../../../core/models/game-types';
import { BandStateService } from '../band-state.service';
import { EquipmentPresentation } from '../equipment-presentation';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { RuleHelpComponent } from '../../rules/rule-help/rule-help.component';
import { EQUIPMENT_RULES } from '../../rules/rule-references';

@Component({
  selector: 'app-equipment-choices', imports: [UiIconComponent, RuleHelpComponent],
  templateUrl: './equipment-choices.component.html', styleUrl: './equipment-choices.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentChoicesComponent {
  readonly kind = input.required<EquipmentKind>();
  readonly selectedId = input.required<string>();
  readonly picked = output<string>();
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  private readonly state = inject(BandStateService);
  private readonly text = inject(GameTextService);
  private readonly presentation = new EquipmentPresentation();
  protected readonly options = computed(() => this.state.catalog.getEquipment(this.kind()).map((entry) => ({
    id: entry.id, ...this.text.equipment(entry), icon: this.presentation.icon(this.kind(), entry.id), rule: EQUIPMENT_RULES[entry.id],
  })));
}
