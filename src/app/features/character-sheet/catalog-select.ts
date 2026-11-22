import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

export interface CatalogOption { readonly name: string; readonly disabled?: boolean; }

@Component({
  selector: 'app-catalog-select',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>{{ label() }}</mat-label>
      <select matNativeControl [id]="controlId()" [formControl]="control()" (change)="selected.emit(control().value)">
        <option value="">{{ placeholder() }}</option>
        @for (option of options(); track option.name) {
          <option [value]="option.name" [disabled]="option.disabled ?? false">{{ option.name }}</option>
        }
      </select>
    </mat-form-field>
  `,
  styles: `:host, mat-form-field { display: block; width: 100%; min-width: 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSelect {
  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly placeholder = input('Choose an option');
  readonly options = input.required<readonly CatalogOption[]>();
  readonly value = input.required<string>();
  readonly selected = output<string>();
  protected readonly control = linkedSignal(() => new FormControl(this.value(), { nonNullable: true }));
}
