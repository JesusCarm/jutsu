import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { BandStateService } from '../band-state.service';

@Component({
  selector: 'app-ninja-name-editor', imports: [ReactiveFormsModule],
  templateUrl: './ninja-name-editor.component.html', styleUrl: './ninja-name-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaNameEditorComponent {
  readonly value = input.required<string>();
  readonly ninjaIndex = input.required<number>();
  protected readonly name = new FormControl('', { nonNullable: true });
  protected readonly state = inject(BandStateService);
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;

  constructor() {
    effect(() => {
      if (this.name.value !== this.value()) this.name.setValue(this.value(), { emitEvent: false });
    });
  }
}
