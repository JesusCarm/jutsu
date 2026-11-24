import { I18nService } from '../../core/i18n/i18n.service';
import { App, Messages } from '../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NinjaEditorComponent } from './ninja-editor/ninja-editor.component';
import { NinjaSummaryComponent } from './ninja-summary/ninja-summary.component';
import { BandStateService } from './band-state.service';
import { PdfActionsComponent } from '../pdf-generator/pdf-actions/pdf-actions.component';
import { PdfToolbarComponent } from '../pdf-generator/pdf-toolbar/pdf-toolbar.component';
import { BandNameEditorComponent } from './band-name-editor/band-name-editor.component';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-character-sheet',
  imports: [NinjaEditorComponent, NinjaSummaryComponent, PdfActionsComponent, PdfToolbarComponent, BandNameEditorComponent, LanguageSwitcherComponent],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly App = App;
  protected readonly Messages = Messages;

  protected readonly state = inject(BandStateService);
  protected readonly selectedIndex = signal(0);
}
