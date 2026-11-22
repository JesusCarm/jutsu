import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BandState } from './band-state';

@Component({
  selector: 'app-band-name-editor',
  imports: [ReactiveFormsModule],
  template: `
    <div class="squad-name-field"><label for="band-name">Escuadra:</label>
      <input id="band-name" [formControl]="name" placeholder="Nombre de tu escuadra" (input)="state.setBandName(name.value)" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandNameEditor {
  protected readonly state = inject(BandState);
  protected readonly name = new FormControl(this.state.band().name, { nonNullable: true });

  constructor() {
    effect(() => {
      const value = this.state.band().name;
      if (this.name.value !== value) this.name.setValue(value, { emitEvent: false });
    });
  }
}
