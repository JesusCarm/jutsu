import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_MEASUREMENT_ID, AnalyticsService } from './analytics.service';

const ID = 'G-TEST000001';
const KEY = 'jutsu.analyticsConsent';
const browser = window as unknown as Record<string, unknown>;

function setup(id = ID) {
  TestBed.configureTestingModule({ providers: [{ provide: ANALYTICS_MEASUREMENT_ID, useValue: id }] });
  const service = TestBed.inject(AnalyticsService);
  service.initialize();
  return service;
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(KEY);
  document.getElementById('google-analytics')?.remove();
  delete browser['gtag'];
  delete browser['dataLayer'];
  delete browser['__JUTSU_CONFIG__'];
  delete browser[`ga-disable-${ID}`];
});

describe('Optional Google Analytics', () => {
  it('disables analytics in development even when runtime configuration contains an ID', () => {
    browser['__JUTSU_CONFIG__'] = { gaMeasurementId: ID };
    const service = TestBed.inject(AnalyticsService);
    service.initialize();
    service.accept();
    expect(service.enabled).toBe(false);
    expect(document.getElementById('google-analytics')).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('makes no Google requests or tracking queue before consent or after rejecting it', () => {
    const service = setup();
    expect(service.showConsent()).toBe(true);
    expect(document.getElementById('google-analytics')).toBeNull();
    expect(browser['dataLayer']).toBeUndefined();
    service.reject();
    service.initialize();
    expect(localStorage.getItem(KEY)).toBe('denied');
    expect(service.showConsent()).toBe(false);
    expect(document.getElementById('google-analytics')).toBeNull();
    expect(browser['dataLayer']).toBeUndefined();
  });

  it('restores a rejected choice without loading Google', () => {
    localStorage.setItem(KEY, 'denied');
    const service = setup();
    expect(service.showConsent()).toBe(false);
    expect(document.getElementById('google-analytics')).toBeNull();
    expect(browser[`ga-disable-${ID}`]).toBe(true);
  });

  it('starts only after acceptance, keeps advertising consent denied and does not duplicate the tag', () => {
    const service = setup();
    service.accept();
    const script = document.querySelector<HTMLScriptElement>('#google-analytics')!;
    expect(script.src).toBe(`https://www.googletagmanager.com/gtag/js?id=${ID}`);
    expect(script.async).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('granted');
    expect(browser['dataLayer']).toEqual([
      ['consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }],
      ['js', expect.any(Date)],
      ['consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }],
      ['config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_domain: window.location.hostname }],
    ]);
    service.openPreferences();
    expect(service.showConsent()).toBe(true);
    service.accept();
    expect(document.querySelectorAll('#google-analytics')).toHaveLength(1);
    expect((browser['dataLayer'] as unknown[][]).filter((command) => command[0] === 'config')).toHaveLength(1);
  });

  it('restores acceptance and disables further collection when consent is withdrawn', () => {
    localStorage.setItem(KEY, 'granted');
    const service = setup();
    expect(service.showConsent()).toBe(false);
    expect(document.getElementById('google-analytics')).not.toBeNull();
    service.openPreferences();
    service.reject();
    expect(browser[`ga-disable-${ID}`]).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('denied');
    expect((browser['dataLayer'] as unknown[][]).at(-1)).toEqual([
      'consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' },
    ]);
  });

  it('keeps working when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    const service = setup();
    expect(service.showConsent()).toBe(true);
    expect(() => service.accept()).not.toThrow();
    expect(service.showConsent()).toBe(false);
    expect(document.getElementById('google-analytics')).not.toBeNull();
  });
});
