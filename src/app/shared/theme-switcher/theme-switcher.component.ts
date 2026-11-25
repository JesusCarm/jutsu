import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { Actions } from '../../core/i18n/i18n-keys';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-theme-switcher',
  imports: [UiIconComponent],
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcherComponent {
  protected readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly preference = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
  private overridden = false;
  protected readonly dark = signal(this.preference?.matches ?? false);
  protected readonly action = computed(() => this.dark() ? Actions.switchToLightMode : Actions.switchToDarkMode);

  constructor() {
    const updatePreference = (event: MediaQueryListEvent) => {
      if (!this.overridden) this.dark.set(event.matches);
    };
    this.preference?.addEventListener('change', updatePreference);
    inject(DestroyRef).onDestroy(() => {
      this.preference?.removeEventListener('change', updatePreference);
      this.document.documentElement.removeAttribute('data-color-scheme');
    });
  }

  protected toggle(): void {
    this.overridden = true;
    this.dark.update((dark) => !dark);
    this.document.documentElement.setAttribute('data-color-scheme', this.dark() ? 'dark' : 'light');
  }
}
