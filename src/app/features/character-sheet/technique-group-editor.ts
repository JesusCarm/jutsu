import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import { TECHNIQUE_GROUPS } from '../../core/models/ninja-options';
import { UiIcon } from '../../shared/ui-icon';
import { BandState } from './band-state';
import { CatalogSelect } from './catalog-select';
import { NinjaLabels } from './ninja-labels';

@Component({
  selector: 'app-technique-group-editor',
  imports: [CatalogSelect, UiIcon],
  template: `
    <fieldset class="form-section technique-editor"><legend><app-ui-icon name="book" />Escuela de jutsu</legend>
      <app-catalog-select label="Escuela de jutsu" [hideLabel]="true" placeholder="Elige una escuela"
        [controlId]="'ninja-' + (ninjaIndex() + 1) + '-technique-group'" [options]="options()" [value]="group().name"
        (selected)="state.selectGroup(ninjaIndex(), $event)" />
      <div class="technique-list">
        @for (technique of group().techniques; track $index) {
          <article class="technique-card">
            <div class="technique-heading"><h3>{{ technique.name }}</h3><span class="chakra-cost" title="Coste de chakra"><app-ui-icon name="chakra" /><span class="sr-only">Chakra: </span>{{ technique.chakra }}</span></div>
            <p>{{ technique.description }}</p>
            @if (technique.isMokushin) { <span class="mokushin-badge"><app-ui-icon name="mokushin" />Mokushin</span> }
          </article>
        } @empty { <p class="empty-techniques">Elige una escuela para consultar sus tres técnicas.</p> }
      </div>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechniqueGroupEditor {
  readonly group = input.required<NinjaSnapshot['techniqueGroup']>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandState);
  private readonly labels = new NinjaLabels();
  protected readonly options = computed(() => TECHNIQUE_GROUPS.map((name) => ({
    name, label: this.labels.group(name), disabled: !this.state.catalog.getTechniqueGroup(name),
  })));
}
