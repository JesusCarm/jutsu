import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import { BandState } from './band-state';
import { CatalogSelect } from './catalog-select';
import { TechniqueGroupEditor } from './technique-group-editor';
import { EquipmentListEditor } from './equipment-list-editor';
import { NinjaLabels } from './ninja-labels';

@Component({
  selector: 'app-ninja-editor',
  imports: [ReactiveFormsModule, CatalogSelect, TechniqueGroupEditor, EquipmentListEditor],
  template: `
    <fieldset class="ninja-editor">
      <legend class="sr-only">Editar Ninja {{ index() + 1 }}</legend>
      <div class="editor-heading"><h2>{{ ninja().name || 'Ninja ' + (index() + 1) }}</h2><span class="badge">{{ labels.type(ninja().type) || 'Sin tipo' }}</span></div>
      <div class="identity-fields">
        <div class="text-field"><label [for]="'ninja-' + (index() + 1) + '-name'">Nombre</label>
          <input [id]="'ninja-' + (index() + 1) + '-name'" [formControl]="name" placeholder="Nombre del ninja"
            (input)="state.setName(index(), name.value)" />
        </div>
        <app-catalog-select label="Tipo" placeholder="Elige un tipo" [controlId]="'ninja-' + (index() + 1) + '-type'"
          [options]="types()" [value]="ninja().type" (selected)="state.selectType(index(), $event)" />
      </div>
      <app-equipment-list-editor kind="weapons" [entries]="ninja().equipment.weapons" [ninjaIndex]="index()" />
      <app-equipment-list-editor kind="items" [entries]="ninja().equipment.items" [ninjaIndex]="index()" />
      <app-technique-group-editor [group]="ninja().techniqueGroup" [ninjaIndex]="index()" />
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaEditor {
  readonly ninja = input.required<NinjaSnapshot>();
  readonly index = input.required<number>();
  protected readonly state = inject(BandState);
  protected readonly labels = new NinjaLabels();
  protected readonly types = computed(() => this.state.catalog.ninjaTypes.map((type) => ({ name: type.name, label: this.labels.type(type.name) })));
  protected readonly name = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.name.value !== this.ninja().name) this.name.setValue(this.ninja().name, { emitEvent: false });
    });
  }
}
