import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { expect, it } from 'vitest';
import { routes } from './app.routes';

it('loads the existing squad editor lazily and redirects unknown routes', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const harness = await RouterTestingHarness.create('/unknown');
  expect(TestBed.inject(Router).url).toBe('/');
  expect(harness.routeNativeElement?.querySelectorAll('.ninja-editor')).toHaveLength(3);
});
