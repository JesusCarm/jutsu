import { I18nService, TRANSLATION_FETCH } from './core/i18n/i18n.service';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { expect, it } from 'vitest';
import { provideTestI18n } from '../../tests/fixtures/i18n-testing';
import english from '../../public/i18n/en.json';
import spanish from '../../public/i18n/es.json';

it('loads the existing squad editor lazily and redirects unknown routes', async () => {
  TestBed.configureTestingModule({ providers: [...provideTestI18n()] });
  await TestBed.inject(I18nService).initialize();
  const harness = await RouterTestingHarness.create('/unknown');
  expect(TestBed.inject(Router).url).toBe('/');
  expect(harness.routeNativeElement?.querySelectorAll('.ninja-editor')).toHaveLength(3);
});

it('keeps the editor and names when following language links and returning to English', async () => {
  TestBed.configureTestingModule({ providers: [...provideTestI18n()] });
  const i18n = TestBed.inject(I18nService);
  await i18n.initialize();
  const harness = await RouterTestingHarness.create('/');
  const router = TestBed.inject(Router);
  const editor = harness.routeNativeElement;
  const input = editor!.querySelector<HTMLInputElement>('#ninja-1-name')!;
  input.value = 'The Ravens';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await harness.navigateByUrl('/?campaign=ravens#ninja-2');
  const spanishLink = editor!.querySelector<HTMLAnchorElement>('[data-language="es"]')!;
  expect(spanishLink.getAttribute('href')).toBe('/es/?campaign=ravens#ninja-2');
  spanishLink.click();
  await harness.fixture.whenStable();
  expect(router.url).toBe('/es/?campaign=ravens#ninja-2');
  expect(i18n.lang()).toBe('es');
  expect(harness.routeNativeElement).toBe(editor);
  expect(editor!.querySelector('#ninja-1-name')).toBe(input);
  expect(input.value).toBe('The Ravens');
  expect(editor!.querySelector('h1')!.textContent).toContain('creador de bandas ninja');
  await harness.navigateByUrl('/');
  expect(i18n.lang()).toBe('en');
  expect(harness.routeNativeElement).toBe(editor);
  expect(input.value).toBe('The Ravens');
});

it('retries a failed dictionary when the current language link is selected again', async () => {
  let offline = true;
  TestBed.configureTestingModule({ providers: [
    ...provideTestI18n(),
    { provide: TRANSLATION_FETCH, useValue: async (url: string) => {
      if (!url.endsWith('/es.json')) return english;
      if (offline) throw new Error('Offline');
      return spanish;
    } },
  ] });
  const i18n = TestBed.inject(I18nService);
  await i18n.initialize();
  const harness = await RouterTestingHarness.create('/');
  await i18n.setLanguage('es');
  await harness.fixture.whenStable();
  expect(i18n.error()).not.toBe('');
  offline = false;
  harness.routeNativeElement!.querySelector<HTMLAnchorElement>('[data-language="es"]')!.click();
  await harness.fixture.whenStable();
  expect(i18n.error()).toBe('');
  expect(harness.routeNativeElement!.querySelector('h1')!.textContent).toBe(spanish.app.heading);
});
