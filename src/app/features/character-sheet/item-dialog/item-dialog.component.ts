import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { BandStateService } from '../band-state.service';
import type { EquipmentSelectionData } from '../selection-dialog-data';
import { SelectionPanelComponent } from '../../../shared/selection-panel/selection-panel.component';
import { EquipmentChoicesComponent } from '../equipment-choices/equipment-choices.component';

@Component({
  selector: 'app-item-dialog', imports: [SelectionPanelComponent, EquipmentChoicesComponent],
  templateUrl: './item-dialog.component.html', styleUrl: './item-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDialogComponent {
  protected readonly data = inject<EquipmentSelectionData>(DIALOG_DATA);
  protected readonly dialog = inject<DialogRef<string>>(DialogRef);
  protected readonly state = inject(BandStateService);
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly ninja = computed(() => this.state.band().ninjas[this.data.ninjaIndex]);
  protected readonly selectedId = computed(() => this.ninja().equipment.items[this.data.slot]?.id ?? '');
}
