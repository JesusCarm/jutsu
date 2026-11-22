import { ChangeDetectionStrategy, Component, inject, input, linkedSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import type { NinjaSnapshot } from '../../core/models/band-snapshot';
import { BandState } from './band-state';
import { CatalogSelect } from './catalog-select';
import { StatsView } from './stats-view';
import { TechniqueGroupEditor } from './technique-group-editor';
import { EquipmentListEditor } from './equipment-list-editor';

@Component({
  selector: 'app-ninja-editor',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput, CatalogSelect, StatsView, TechniqueGroupEditor, EquipmentListEditor],
  template: `
    <fieldset class="ninja-editor">
      <legend>Ninja {{ index() + 1 }}</legend>
      <div class="identity-fields">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Name</mat-label>
          <input matInput [id]="'ninja-' + (index() + 1) + '-name'" [formControl]="name()"
            (input)="state.setName(index(), name().value)" />
        </mat-form-field>
        <app-catalog-select label="Type" placeholder="Choose a type" [controlId]="'ninja-' + (index() + 1) + '-type'"
          [options]="state.catalog.ninjaTypes" [value]="ninja().type" (selected)="state.selectType(index(), $event)" />
      </div>
      <app-stats-view [stats]="ninja().stats" />
      <app-technique-group-editor [group]="ninja().techniqueGroup" [ninjaIndex]="index()" />
      <fieldset class="form-section">
        <legend>Equipment</legend>
        <div class="equipment-columns">
          <app-equipment-list-editor kind="weapons" [entries]="ninja().equipment.weapons" [ninjaIndex]="index()" />
          <app-equipment-list-editor kind="items" [entries]="ninja().equipment.items" [ninjaIndex]="index()" />
        </div>
      </fieldset>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaEditor {
  readonly ninja = input.required<NinjaSnapshot>();
  readonly index = input.required<number>();
  protected readonly state = inject(BandState);
  protected readonly name = linkedSignal(() => new FormControl(this.ninja().name, { nonNullable: true }));
}
