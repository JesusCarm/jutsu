import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import { SelectionPanelComponent } from '../../../shared/selection-panel/selection-panel.component';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { BandStateService } from '../band-state.service';
import type { NinjaSelectionData } from '../selection-dialog-data';
import { NinjaTypePresentation } from '../ninja-type-presentation';
import { StatsViewComponent } from '../stats-view/stats-view.component';
import { NinjaEditorComponent } from '../ninja-editor/ninja-editor.component';

@Component({
  selector: 'app-ninja-details-dialog',
  imports: [SelectionPanelComponent, UiIconComponent, StatsViewComponent, NinjaEditorComponent],
  templateUrl: './ninja-details-dialog.component.html',
  styleUrl: './ninja-details-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaDetailsDialogComponent {
  protected readonly data = inject<NinjaSelectionData>(DIALOG_DATA);
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly text = inject(GameTextService);
  private readonly state = inject(BandStateService);
  private readonly typePresentation = new NinjaTypePresentation();
  protected readonly ninja = computed(() => this.state.band().ninjas[this.data.ninjaIndex]);
  protected readonly typeIcon = computed(() => this.typePresentation.icon(this.ninja().type));
}
