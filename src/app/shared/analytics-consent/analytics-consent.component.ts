import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AnalyticsService } from '../../core/analytics/analytics.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Analytics } from '../../core/i18n/i18n-keys';

@Component({
  selector: 'app-analytics-consent',
  templateUrl: './analytics-consent.component.html',
  styleUrl: './analytics-consent.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsConsentComponent {
  protected readonly analytics = inject(AnalyticsService);
  protected readonly i18n = inject(I18nService);
  protected readonly Analytics = Analytics;
}
