import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { BandState } from './band-state';

@Component({
  selector: 'app-band-name-editor',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatInput],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Squad name</mat-label>
      <input matInput id="band-name" [formControl]="name" (input)="state.setBandName(name.value)" />
    </mat-form-field>
  `,
  styles: `:host { display: block; max-width: 30rem; margin-bottom: 1.5rem; }`,
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
