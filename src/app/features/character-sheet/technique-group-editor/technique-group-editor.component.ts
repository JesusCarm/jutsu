import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Stats } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { TECHNIQUE_GROUPS } from '../../../core/models/ninja-options';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { BandStateService } from '../band-state.service';
import { CatalogSelectComponent } from '../catalog-select/catalog-select.component';

@Component({
  selector: 'app-technique-group-editor',
  imports: [CatalogSelectComponent, UiIconComponent],
  templateUrl: './technique-group-editor.component.html',
  styleUrl: './technique-group-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechniqueGroupEditorComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly Stats = Stats;
  protected readonly text = inject(GameTextService);

  readonly group = input.required<NinjaSnapshot['techniqueGroup']>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandStateService);
  protected readonly techniques = computed(() => this.group().techniques.map((technique) => this.text.technique(technique)));
  protected readonly options = computed(() => TECHNIQUE_GROUPS.map((id) => ({
    id, label: this.text.groupName(id), disabled: !this.state.catalog.getTechniqueGroup(id),
  })));
}
