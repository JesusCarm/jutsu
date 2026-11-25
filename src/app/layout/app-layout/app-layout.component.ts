import { I18nService } from '../../core/i18n/i18n.service';
import { App, Footer } from '../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { version } from '../../../../package.json';

@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly App = App;
  protected readonly Footer = Footer;
  protected readonly version = version;
}
