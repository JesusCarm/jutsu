import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Actions, App } from '../../core/i18n/i18n-keys';
import { LANGUAGES, type Language } from '../../core/i18n/languages';
import { UiIconComponent } from '../ui-icon/ui-icon.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-language-switcher',
  imports: [UiIconComponent, RouterLink],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly languages = LANGUAGES;
  protected readonly App = App;
  protected readonly Actions = Actions;

  protected retryLanguage(language: Language): void {
    if (this.i18n.error() && language === this.i18n.lang()) void this.i18n.setLanguage(language);
  }
}
