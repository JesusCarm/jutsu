import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PdfTemplatesService } from '../pdf-templates.service';

@Component({
  selector: 'app-pdf-template-select',
  imports: [ReactiveFormsModule],
  templateUrl: './pdf-template-select.component.html',
  styleUrl: './pdf-template-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfTemplateSelectComponent {
  protected readonly templates = inject(PdfTemplatesService);
  protected readonly selection = new FormControl(this.templates.selectedId(), { nonNullable: true });

  constructor() {
    effect(() => {
      const value = this.templates.selectedId();
      if (this.selection.value !== value) this.selection.setValue(value, { emitEvent: false });
    });
  }
}
