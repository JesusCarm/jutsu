import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PdfTemplates } from './pdf-templates';

@Component({
  selector: 'app-pdf-template-select',
  imports: [ReactiveFormsModule],
  template: `
    <label for="pdf-template">Plantilla de ficha</label>
    <span class="select-wrap"><select id="pdf-template" [formControl]="selection" (change)="templates.select(selection.value)">
      @for (option of templates.options; track option.id) { <option [value]="option.id">{{ option.label }}</option> }
    </select></span>
  `,
  styles: `:host { display: block; min-width: 0; }`,
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
