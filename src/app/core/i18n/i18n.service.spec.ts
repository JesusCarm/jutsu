import { DOCUMENT, Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { firstValueFrom, filter } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import english from '../../../../public/i18n/en.json';
import spanish from '../../../../public/i18n/es.json';
import { PlatformAssetsService } from '../services/platform-assets.service';
import { App, Stats } from './i18n-keys';
import { I18nService, TRANSLATION_FETCH, type TranslationFetch } from './i18n.service';
import { provideTestI18n } from '../../../../tests/fixtures/i18n-testing';

function setup(url = '/', fetchDictionary?: TranslationFetch) {
  TestBed.configureTestingModule({ providers: [
    ...provideTestI18n(), provideLocationMocks(),
    ...(fetchDictionary ? [{ provide: TRANSLATION_FETCH, useValue: fetchDictionary }] : []),
  ] });
  const location = TestBed.inject(Location);
  location.go(url);
  return { i18n: TestBed.inject(I18nService), location, router: TestBed.inject(Router) };
}

describe('I18n service and URL language', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(['/', '/?lang=unsupported', '/?lang=EN'])('defaults to English for %s', async (url) => {
    const { i18n } = setup(url);
    await i18n.initialize();
    expect(i18n.lang()).toBe('en');
    expect(i18n.t(App.subtitle)).toBe('Squad editor');
    expect(i18n.loading()).toBe(false);
  });

  it('initializes a direct Spanish URL and uses English for untranslated entries', async () => {
    const { i18n } = setup('/?lang=es');
    await i18n.initialize();
    expect(i18n.lang()).toBe('es');
    expect(i18n.t(App.subtitle)).toBe('Editor de escuadra');
    expect(i18n.t(Stats.movement)).toBe('Movement');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('es');
  });

  it('loads asynchronously under the app base and waits for the requested dictionary', async () => {
    let releaseEnglish!: (value: unknown) => void;
    let releaseSpanish!: (value: unknown) => void;
    const fetchDictionary = vi.fn<TranslationFetch>((url) => new Promise((resolve) => {
      if (url.endsWith('/en.json')) releaseEnglish = resolve;
      else releaseSpanish = resolve;
    }));
    TestBed.configureTestingModule({ providers: [
      ...provideTestI18n(), provideLocationMocks(),
      { provide: TRANSLATION_FETCH, useValue: fetchDictionary },
      { provide: PlatformAssetsService, useValue: { publicUrl: (path: string) => `https://example.test/games/jutsu/${path}` } },
    ] });
    TestBed.inject(Location).go('/?lang=es');
    const i18n = TestBed.inject(I18nService);
    let initialized = false;
    const pending = i18n.initialize().then(() => { initialized = true; });
    expect(fetchDictionary).toHaveBeenCalledWith('https://example.test/games/jutsu/i18n/en.json');
    expect(initialized).toBe(false);
    releaseEnglish(english);
    await vi.waitFor(() => expect(fetchDictionary).toHaveBeenCalledWith('https://example.test/games/jutsu/i18n/es.json'));
    expect(initialized).toBe(false);
    expect(i18n.loading()).toBe(true);
    releaseSpanish(spanish);
    await pending;
    expect(i18n.t(App.subtitle)).toBe('Editor de escuadra');
  });

  it('preserves query parameters and fragments, caches languages, and follows Back and Forward', async () => {
    const fetchDictionary = vi.fn<TranslationFetch>(async (url) => url.endsWith('/es.json') ? spanish : english);
    const { i18n, router, location } = setup('/', fetchDictionary);
    await i18n.initialize();
    router.setUpLocationChangeListener();
    await router.navigateByUrl('/?campaign=ravens&tag=a&tag=b#ninja-2');
    const storage = vi.spyOn(Storage.prototype, 'setItem');
    await i18n.setLanguage('es');
    const tree = router.parseUrl(router.url);
    expect(tree.queryParamMap.get('campaign')).toBe('ravens');
    expect(tree.queryParamMap.getAll('tag')).toEqual(['a', 'b']);
    expect(tree.fragment).toBe('ninja-2');
    expect(tree.queryParamMap.get('lang')).toBe('es');
    const snapshot = i18n.snapshot();
    await i18n.setLanguage('en');
    expect(snapshot.t(App.subtitle)).toBe('Editor de escuadra');
    const navigate = async (action: () => void) => {
      const ended = firstValueFrom(router.events.pipe(filter((event) => event instanceof NavigationEnd)));
      action();
      await ended;
      await vi.waitFor(() => expect(i18n.loading()).toBe(false));
    };
    await navigate(() => location.back());
    expect(i18n.lang()).toBe('es');
    await navigate(() => location.forward());
    expect(i18n.lang()).toBe('en');
    expect(fetchDictionary.mock.calls.filter(([url]) => url.endsWith('/en.json'))).toHaveLength(1);
    expect(fetchDictionary.mock.calls.filter(([url]) => url.endsWith('/es.json'))).toHaveLength(1);
    expect(storage).not.toHaveBeenCalled();
    const revision = i18n.revision();
    await router.navigateByUrl('/?lang=en&campaign=other');
    expect(i18n.revision()).toBe(revision);
  });

  it('ignores a late response after navigating to another language', async () => {
    let release!: (value: unknown) => void;
    const { i18n, router } = setup('/', (url) => url.endsWith('/es.json') ? new Promise((resolve) => { release = resolve; }) : Promise.resolve(english));
    await i18n.initialize();
    await router.navigateByUrl('/?lang=es');
    expect(i18n.loading()).toBe(true);
    await i18n.setLanguage('en');
    release(spanish);
    await Promise.resolve();
    expect(i18n.lang()).toBe('en');
    expect(i18n.t(App.subtitle)).toBe('Squad editor');
  });

  it('keeps the URL language on a failed locale request, falls back to English and can retry', async () => {
    let fail = true;
    const { i18n, router } = setup('/?lang=es', async (url) => {
      if (url.endsWith('/es.json')) {
        if (fail) throw new Error('Offline');
        return spanish;
      }
      return english;
    });
    await i18n.initialize();
    expect(i18n.lang()).toBe('es');
    expect(i18n.t(App.subtitle)).toBe('Squad editor');
    expect(i18n.error()).toContain('could not be loaded');
    await router.navigateByUrl('/?lang=es');
    await vi.waitFor(() => expect(i18n.error()).not.toBe(''));
    fail = false;
    await i18n.setLanguage('es');
    expect(i18n.error()).toBe('');
    expect(i18n.t(App.subtitle)).toBe('Editor de escuadra');
  });

  it('rejects initialization with a readable error if the English reference is unavailable', async () => {
    const { i18n } = setup('/', async () => { throw new Error('404'); });
    await expect(i18n.initialize()).rejects.toThrow('Could not load the English translations');
  });
});
