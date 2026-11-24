import { TRANSLATION_FETCH, I18nService } from './core/i18n/i18n.service';
import english from '../../public/i18n/en.json';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { expect, it } from 'vitest';
import { routes } from './app.routes';

it('loads the existing squad editor lazily and redirects unknown routes', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter(routes), {provide: TRANSLATION_FETCH, useValue: async () => english}] });
  await TestBed.inject(I18nService).initialize();
  const harness = await RouterTestingHarness.create('/unknown');
  expect(TestBed.inject(Router).url).toBe('/');
  expect(harness.routeNativeElement?.querySelectorAll('.ninja-editor')).toHaveLength(3);
});
