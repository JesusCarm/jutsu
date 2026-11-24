import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Actions, App } from '../../core/i18n/i18n-keys';
import { LANGUAGES } from '../../core/i18n/languages';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-language-switcher',
  imports: [UiIconComponent],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly languages = LANGUAGES;
  protected readonly App = App;
  protected readonly Actions = Actions;
}
