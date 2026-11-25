import { DOCUMENT } from '@angular/common';
import { inject, Injectable, InjectionToken, isDevMode, signal } from '@angular/core';

type Consent = 'granted' | 'denied';
type AnalyticsWindow = Window & {
  __JUTSU_CONFIG__?: { gaMeasurementId?: unknown };
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
} & { [key: `ga-disable-${string}`]: boolean | undefined };

export const ANALYTICS_MEASUREMENT_ID = new InjectionToken<string>('Google Analytics measurement ID', {
  providedIn: 'root',
  factory: () => {
    if (isDevMode()) return '';
    const browser = inject(DOCUMENT).defaultView as AnalyticsWindow | null;
    const id = browser?.__JUTSU_CONFIG__?.gaMeasurementId;
    return typeof id === 'string' && /^G-[A-Z0-9]+$/.test(id) ? id : '';
  },
});

const CONSENT_KEY = 'jutsu.analyticsConsent';
const DENIED = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = this.document.defaultView as AnalyticsWindow | null;
  private readonly measurementId = inject(ANALYTICS_MEASUREMENT_ID);
  private initialized = false;
  private started = false;
  readonly enabled = !!this.browser && !!this.measurementId;
  readonly showConsent = signal(false);

  initialize(): void {
    if (!this.enabled || this.initialized) return;
    this.initialized = true;
    let saved: string | null = null;
    try { saved = this.browser!.localStorage.getItem(CONSENT_KEY); } catch { /* Storage can be unavailable. */ }
    if (saved === 'granted') this.start();
    else if (saved === 'denied') this.disable();
    else this.showConsent.set(true);
  }

  openPreferences(): void {
    if (this.enabled) this.showConsent.set(true);
  }

  accept(): void { this.choose('granted'); }
  reject(): void { this.choose('denied'); }

  private choose(consent: Consent): void {
    if (!this.enabled) return;
    try { this.browser!.localStorage.setItem(CONSENT_KEY, consent); } catch { /* Keep the choice for the current page. */ }
    this.showConsent.set(false);
    if (consent === 'granted') this.start();
    else this.disable();
  }

  private start(): void {
    const browser = this.browser!;
    browser[`ga-disable-${this.measurementId}`] = false;
    if (this.started) {
      browser.gtag?.('consent', 'update', { ...DENIED, analytics_storage: 'granted' });
      return;
    }
    this.started = true;
    browser.dataLayer ??= [];
    browser.gtag ??= (...args: unknown[]) => { browser.dataLayer!.push(args); };
    browser.gtag('consent', 'default', DENIED);
    browser.gtag('js', new Date());
    browser.gtag('consent', 'update', { ...DENIED, analytics_storage: 'granted' });
    browser.gtag('config', this.measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: browser.location.hostname,
    });
    const script = this.document.createElement('script');
    script.id = 'google-analytics';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
    this.document.head.appendChild(script);
  }

  private disable(): void {
    const browser = this.browser!;
    browser[`ga-disable-${this.measurementId}`] = true;
    browser.gtag?.('consent', 'update', DENIED);
  }
}
