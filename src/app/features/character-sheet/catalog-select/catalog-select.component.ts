import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, inject, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface CatalogOption { readonly id: string; readonly label: string; readonly disabled?: boolean; }

@Component({
  selector: 'app-catalog-select',
  imports: [ReactiveFormsModule],
  templateUrl: './catalog-select.component.html',
  styleUrl: './catalog-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSelectComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;

  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly placeholder = input<string>();
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
