import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { BandStateService } from '../band-state.service';
import { CatalogSelectComponent } from '../catalog-select/catalog-select.component';
import { TechniqueGroupEditorComponent } from '../technique-group-editor/technique-group-editor.component';
import { EquipmentListEditorComponent } from '../equipment-list-editor/equipment-list-editor.component';
import { NinjaLabels } from '../ninja-labels';

@Component({
  selector: 'app-ninja-editor',
  imports: [ReactiveFormsModule, CatalogSelectComponent, TechniqueGroupEditorComponent, EquipmentListEditorComponent],
  templateUrl: './ninja-editor.component.html',
  styleUrl: './ninja-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaEditorComponent {
  readonly ninja = input.required<NinjaSnapshot>();
  readonly index = input.required<number>();
  protected readonly state = inject(BandStateService);
  protected readonly labels = new NinjaLabels();
  protected readonly types = computed(() => this.state.catalog.ninjaTypes.map((type) => ({ name: type.name, label: this.labels.type(type.name) })));
  protected readonly name = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.name.value !== this.ninja().name) this.name.setValue(this.ninja().name, { emitEvent: false });
    });
  }
}
