import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import { BandStateService } from '../band-state.service';
import type { NinjaSelectionData } from '../selection-dialog-data';
import { SelectionPanelComponent } from '../../../shared/selection-panel/selection-panel.component';
import { TechniqueListComponent } from '../technique-list/technique-list.component';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';

@Component({
  selector: 'app-technique-school-dialog', imports: [SelectionPanelComponent, TechniqueListComponent, UiIconComponent],
  templateUrl: './technique-school-dialog.component.html', styleUrl: './technique-school-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechniqueSchoolDialogComponent {
  protected readonly data = inject<NinjaSelectionData>(DIALOG_DATA);
  protected readonly dialog = inject<DialogRef<string>>(DialogRef);
  protected readonly state = inject(BandStateService);
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly text = inject(GameTextService);
  protected readonly ninja = computed(() => this.state.band().ninjas[this.data.ninjaIndex]);
}
