import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { EquipmentEffectsComponent } from '../equipment-effects/equipment-effects.component';
import { TechniqueListComponent } from '../technique-list/technique-list.component';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';

@Component({
  selector: 'app-ninja-editor', imports: [EquipmentEffectsComponent, TechniqueListComponent, UiIconComponent],
  templateUrl: './ninja-editor.component.html', styleUrl: './ninja-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaEditorComponent {
  readonly ninja = input.required<NinjaSnapshot>();
  readonly index = input.required<number>();
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly text = inject(GameTextService);
}
