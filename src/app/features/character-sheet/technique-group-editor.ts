import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import { TECHNIQUE_GROUPS } from '../../core/models/ninja-options';
import { BandState } from './band-state';
import { CatalogSelect } from './catalog-select';

@Component({
  selector: 'app-technique-group-editor',
  imports: [CatalogSelect],
  template: `
    <fieldset class="form-section"><legend>Techniques</legend>
      <app-catalog-select label="Technique group" placeholder="Choose a group" [controlId]="'ninja-' + (ninjaIndex() + 1) + '-technique-group'"
        [options]="options()" [value]="group().name" (selected)="state.selectGroup(ninjaIndex(), $event)" />
      <div class="technique-list">
        @for (technique of group().techniques; track $index) {
          <fieldset class="technique-card"><legend>Technique {{ $index + 1 }}</legend>
            <dl class="technique-fields">
              <div class="read-only-field"><dt>Name</dt><dd>{{ technique.name }}</dd></div>
              <div class="read-only-field"><dt>Chakra cost</dt><dd>{{ technique.chakra }}</dd></div>
              <div class="read-only-field"><dt>Short description</dt><dd>{{ technique.description }}</dd></div>
              <div class="read-only-field"><dt>Mokushin</dt><dd>{{ technique.isMokushin ? 'Yes' : 'No' }}</dd></div>
            </dl>
          </fieldset>
        } @empty { <p class="form-help">Select a group to see its three techniques.</p> }
      </div>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechniqueGroupEditor {
  readonly group = input.required<NinjaSnapshot['techniqueGroup']>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandState);
  protected readonly options = computed(() => TECHNIQUE_GROUPS.map((name) => ({ name, disabled: !this.state.catalog.getTechniqueGroup(name) })));
}
