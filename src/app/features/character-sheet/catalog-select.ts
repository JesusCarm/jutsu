import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface CatalogOption { readonly name: string; readonly label?: string; readonly disabled?: boolean; }

@Component({
  selector: 'app-catalog-select',
  imports: [ReactiveFormsModule],
  template: `
    <label [for]="controlId()" [class.sr-only]="hideLabel()">{{ label() }}</label>
    <span class="select-wrap">
      <select [id]="controlId()" [formControl]="control" [class.is-placeholder]="!control.value" [attr.aria-describedby]="describedBy() || null"
        (change)="selected.emit(control.value)">
        <option value="">{{ placeholder() }}</option>
        @for (option of options(); track option.name) {
          <option [value]="option.name" [disabled]="option.disabled ?? false">{{ option.label ?? option.name }}</option>
        }
      </select>
    </span>
  `,
  styles: `:host { display: block; width: 100%; min-width: 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSelect {
  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly placeholder = input('Elige una opción');
  readonly options = input.required<readonly CatalogOption[]>();
  readonly value = input.required<string>();
  readonly hideLabel = input(false);
  readonly describedBy = input('');
  readonly selected = output<string>();
  protected readonly control = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      if (this.control.value !== this.value()) this.control.setValue(this.value(), { emitEvent: false });
    });
  }
}
