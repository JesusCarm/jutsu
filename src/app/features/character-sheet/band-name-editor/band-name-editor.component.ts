import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BandStateService } from '../band-state.service';

@Component({
  selector: 'app-band-name-editor',
  imports: [ReactiveFormsModule],
  templateUrl: './band-name-editor.component.html',
  styleUrl: './band-name-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandNameEditorComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;

  protected readonly state = inject(BandStateService);
  protected readonly name = new FormControl(this.state.band().name, { nonNullable: true });

  constructor() {
    effect(() => {
      const value = this.state.band().name;
      if (this.name.value !== value) this.name.setValue(value, { emitEvent: false });
    });
  }
}
