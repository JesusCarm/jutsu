import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import { PlatformAssetsService } from './platform-assets.service';

it('resolves bundled resources beneath the application base path', () => {
  TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { baseURI: 'https://example.test/jutsu/' } }] });
  expect(TestBed.inject(PlatformAssetsService).baseUrl).toBe('https://example.test/jutsu/assets/');
  expect(TestBed.inject(PlatformAssetsService).publicUrl('i18n/es.json')).toBe('https://example.test/jutsu/i18n/es.json');
});
