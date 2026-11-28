import { Location } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { NavigationEnd, PRIMARY_OUTLET, Router, type UrlTree } from '@angular/router';
import { PlatformAssetsService } from '../services/platform-assets.service';
import { Messages, type TranslationKey } from './i18n-keys';
import { SeoService } from '../seo/seo.service';
import site from '../seo/site-config.json';
import { DEFAULT_LANGUAGE, supportedLanguage, type Language } from './languages';
import { TranslationDictionary, type TranslationParams } from './translation-dictionary';

export type TranslationFetch = (url: string) => Promise<unknown>;
export const TRANSLATION_FETCH = new InjectionToken<TranslationFetch>('Load a translation dictionary', {
  providedIn: 'root',
  factory: () => async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load translations (${response.status}).`);
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid translation dictionary.');
    return data;
  },
});

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly seo = inject(SeoService);
  private readonly assets = inject(PlatformAssetsService);
  private readonly fetchDictionary = inject(TRANSLATION_FETCH);
  private readonly currentUrl = signal(this.location.path(true) || '/');
  private readonly cache = new Map<Language, Promise<unknown>>();
  private readonly state = signal({ lang: DEFAULT_LANGUAGE, dictionary: new TranslationDictionary(), loading: true, revision: 0, failed: false });
  private english: unknown = {};
  private initial: Promise<void> | undefined;
  private pending: Promise<void> = Promise.resolve();
  private request = 0;
  readonly lang = computed(() => this.state().lang);
  readonly loading = computed(() => this.state().loading);
  readonly revision = computed(() => this.state().revision);
  readonly error = computed(() => this.state().failed ? this.t(Messages.languageLoadFailed) : '');

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
        if (this.initial) {
          const lang = this.languageFromUrl(event.urlAfterRedirects);
          if (lang !== this.lang() || this.state().failed) this.pending = this.activate(lang);
        }
      }
    });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  initialize(): Promise<void> {
    return this.initial ??= this.start();
  }

  async setLanguage(value: string): Promise<void> {
    await this.initialize();
    const tree = this.languageUrl(value);
    const navigated = await this.router.navigateByUrl(tree);
    if (!navigated && this.state().failed) this.pending = this.activate(this.languageFromUrl(this.location.path(true)));
    // NavigationEnd owns the language state, including Back and Forward navigations.
    await this.pending;
  }

  languageUrl(value: string): UrlTree {
    const current = this.router.parseUrl(this.currentUrl());
    const tree = this.router.parseUrl(`/${site.paths[supportedLanguage(value)]}`);
    tree.queryParams = { ...current.queryParams };
    delete tree.queryParams['lang'];
    tree.fragment = current.fragment;
    return tree;
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    return this.state().dictionary.t(key, params);
  }

  snapshot(): TranslationDictionary {
    return this.state().dictionary;
  }

  private async start(): Promise<void> {
    this.currentUrl.set(this.location.path(true) || '/');
    try {
      this.english = await this.load(DEFAULT_LANGUAGE);
    } catch {
      throw new Error('Could not load the English translations. Check your connection and reload the page.');
    }
    await this.activate(this.languageFromUrl(this.location.path(true)), true);
  }

  private languageFromUrl(url: string): Language {
    const tree = this.router.parseUrl(url || '/');
    const path = tree.root.children[PRIMARY_OUTLET]?.segments[0]?.path;
    if (path === 'es') return 'es';
    return supportedLanguage(tree.queryParamMap.get('lang'));
  }

  private async activate(lang: Language, force = false): Promise<void> {
    if (!force && lang === this.lang() && !this.state().failed) return;
    const request = ++this.request;
    this.state.update((state) => ({ lang, dictionary: new TranslationDictionary(this.english), loading: true, revision: state.revision + 1, failed: false }));
    let active: unknown = {};
    let failed = false;
    try { active = await this.load(lang); } catch { failed = true; }
    if (request !== this.request) return;
    this.state.update((state) => ({ ...state, dictionary: new TranslationDictionary(this.english, active), loading: false, failed }));
    this.seo.update(lang, this.snapshot());
  }

  private load(lang: Language): Promise<unknown> {
    let cached = this.cache.get(lang);
    if (!cached) {
      cached = this.fetchDictionary(this.assets.publicUrl(`i18n/${lang}.json`)).catch((error: unknown) => {
        this.cache.delete(lang);
        throw error;
      });
      this.cache.set(lang, cached);
    }
    return cached;
  }
}
