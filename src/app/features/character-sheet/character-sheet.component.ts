import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NinjaEditorComponent } from './ninja-editor/ninja-editor.component';
import { NinjaSummaryComponent } from './ninja-summary/ninja-summary.component';
import { BandStateService } from './band-state.service';
import { PdfActionsComponent } from '../pdf-generator/pdf-actions/pdf-actions.component';
import { PdfToolbarComponent } from '../pdf-generator/pdf-toolbar/pdf-toolbar.component';
import { BandNameEditorComponent } from './band-name-editor/band-name-editor.component';

@Component({
  selector: 'app-character-sheet',
  imports: [NinjaEditorComponent, NinjaSummaryComponent, PdfActionsComponent, PdfToolbarComponent, BandNameEditorComponent],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetComponent {
  protected readonly state = inject(BandStateService);
  protected readonly selectedIndex = signal(0);
}
