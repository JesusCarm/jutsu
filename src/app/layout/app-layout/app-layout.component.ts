import { I18nService } from '../../core/i18n/i18n.service';
import { App } from '../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly App = App;
}
