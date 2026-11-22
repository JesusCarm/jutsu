import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NinjaEditor } from './ninja-editor';
import { BandState } from './band-state';
import { PdfActions } from '../pdf-generator/pdf-actions';

@Component({
  selector: 'app-character-sheet',
  imports: [NinjaEditor, PdfActions],
  template: `
    <section class="builder" aria-labelledby="squad-heading">
      <div class="builder-heading"><span class="accent" aria-hidden="true"></span><h2 id="squad-heading">Your ninja squad</h2></div>
      <form id="band-form" class="band-form" aria-labelledby="squad-heading" aria-describedby="band-help" (submit)="$event.preventDefault()">
        <p id="band-help" class="form-help">Create a squad of three ninjas. Choose their types, techniques and equipment.</p>
        <div class="ninja-list">
          @for (ninja of state.band().ninjas; track $index) {
            <app-ninja-editor [ninja]="ninja" [index]="$index" />
          }
        </div>
      </form>
      <app-pdf-actions />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheet { protected readonly state = inject(BandState); }
