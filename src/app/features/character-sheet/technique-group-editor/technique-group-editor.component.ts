import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { TECHNIQUE_GROUPS } from '../../../core/models/ninja-options';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { BandStateService } from '../band-state.service';
import { CatalogSelectComponent } from '../catalog-select/catalog-select.component';
import { NinjaLabels } from '../ninja-labels';

@Component({
  selector: 'app-technique-group-editor',
  imports: [CatalogSelectComponent, UiIconComponent],
  templateUrl: './technique-group-editor.component.html',
  styleUrl: './technique-group-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechniqueGroupEditorComponent {
  readonly group = input.required<NinjaSnapshot['techniqueGroup']>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandStateService);
  private readonly labels = new NinjaLabels();
  protected readonly options = computed(() => TECHNIQUE_GROUPS.map((name) => ({
    name, label: this.labels.group(name), disabled: !this.state.catalog.getTechniqueGroup(name),
  })));
}
