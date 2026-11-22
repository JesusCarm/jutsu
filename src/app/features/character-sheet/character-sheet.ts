import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NinjaEditor } from './ninja-editor';
import { NinjaSummary } from './ninja-summary';
import { BandState } from './band-state';
import { PdfActions } from '../pdf-generator/pdf-actions';
import { PdfToolbar } from '../pdf-generator/pdf-toolbar';
import { BandNameEditor } from './band-name-editor';

@Component({
  selector: 'app-character-sheet',
  imports: [NinjaEditor, NinjaSummary, PdfActions, PdfToolbar, BandNameEditor],
  template: `
    <section class="builder" aria-labelledby="squad-heading">
      <header class="editor-toolbar"><div class="editor-brand"><h1 id="squad-heading">JUTSU</h1><span class="editor-subtitle">Editor de escuadra</span></div><app-pdf-toolbar /></header>
      <form id="band-form" class="band-form" aria-labelledby="squad-heading" aria-describedby="band-help" (submit)="$event.preventDefault()">
        <div class="squad-bar"><div><app-band-name-editor /><p id="band-help">Personaliza los 3 ninjas de la escuadra</p></div><span class="badge squad-count">3 ninjas</span></div>
        <div class="ninja-grid">
          @for (ninja of state.band().ninjas; track $index) {
            <article class="ninja-column" [class.is-selected]="selectedIndex() === $index" [style.--ninja-column]="$index + 1">
              <app-ninja-summary [ninja]="ninja" [index]="$index" [active]="selectedIndex() === $index" (selected)="selectedIndex.set($index)" />
              <div class="ninja-panel" [id]="'ninja-' + ($index + 1) + '-panel'" role="region" [attr.aria-labelledby]="'ninja-' + ($index + 1) + '-title'">
                <app-ninja-editor [ninja]="ninja" [index]="$index" />
              </div>
            </article>
          }
        </div>
      </form>
      <app-pdf-actions />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheet {
  protected readonly state = inject(BandState);
  protected readonly selectedIndex = signal(0);
}
