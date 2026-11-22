import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { PlatformAssets } from './platform-assets';

it('resolves bundled resources beneath the application base path', () => {
  TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { baseURI: 'https://example.test/jutsu/' } }] });
  expect(TestBed.inject(PlatformAssets).baseUrl).toBe('https://example.test/jutsu/assets/');
});
