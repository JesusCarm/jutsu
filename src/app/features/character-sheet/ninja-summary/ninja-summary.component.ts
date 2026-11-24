import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Actions, Labels } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { EquipmentSummaryComponent } from '../equipment-summary/equipment-summary.component';
import { StatsViewComponent } from '../stats-view/stats-view.component';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { NinjaTypePresentation } from '../ninja-type-presentation';
import { NinjaNameEditorComponent } from '../ninja-name-editor/ninja-name-editor.component';
import { NinjaDialogsService } from '../ninja-dialogs.service';

@Component({
  selector: 'app-ninja-summary',
  imports: [StatsViewComponent, EquipmentSummaryComponent, UiIconComponent, NinjaNameEditorComponent],
  templateUrl: './ninja-summary.component.html', styleUrl: './ninja-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaSummaryComponent {
  readonly ninja = input.required<NinjaSnapshot>();
  readonly index = input.required<number>();
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly Actions = Actions;
  protected readonly text = inject(GameTextService);
  protected readonly dialogs = inject(NinjaDialogsService);
  private readonly typePresentation = new NinjaTypePresentation();
  protected readonly typeIcon = computed(() => this.typePresentation.icon(this.ninja().type));

}
