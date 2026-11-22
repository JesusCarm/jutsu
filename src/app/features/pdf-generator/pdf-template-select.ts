import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { PdfTemplates } from './pdf-templates';

@Component({
  selector: 'app-pdf-template-select',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Sheet template</mat-label>
      <select matNativeControl id="pdf-template" [formControl]="selection" (change)="templates.select(selection.value)">
        @for (option of templates.options; track option.id) {
          <option [value]="option.id">{{ option.label }}</option>
        }
      </select>
    </mat-form-field>
  `,
  styles: `:host { display: block; max-width: 30rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfTemplateSelect {
  protected readonly templates = inject(PdfTemplates);
  protected readonly selection = new FormControl(this.templates.selectedId(), { nonNullable: true });

  constructor() {
    effect(() => {
      const value = this.templates.selectedId();
      if (this.selection.value !== value) this.selection.setValue(value, { emitEvent: false });
    });
  }
}
