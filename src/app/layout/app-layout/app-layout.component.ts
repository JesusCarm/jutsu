import { I18nService } from '../../core/i18n/i18n.service';
import { Analytics, App, Footer } from '../../core/i18n/i18n-keys';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { version } from '../../../../package.json';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { AnalyticsConsentComponent } from '../../shared/analytics-consent/analytics-consent.component';

@Component({
  selector: 'app-layout',
  imports: [AnalyticsConsentComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly App = App;
  protected readonly Footer = Footer;
  protected readonly version = version;
  protected readonly analytics = inject(AnalyticsService);
  protected readonly Analytics = Analytics;
}
