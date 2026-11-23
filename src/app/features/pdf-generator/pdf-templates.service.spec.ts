import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PlatformAssetsService } from '../../core/services/platform-assets.service';
import { BandStateService } from '../character-sheet/band-state.service';
import { PDF_TEMPLATE_OPTIONS, PdfTemplatesService } from './pdf-templates.service';

describe('Available PDF templates', () => {
  it('offers only the current three-ninja sheet with local resources under the app base path', () => {
    TestBed.configureTestingModule({ providers: [
      { provide: PlatformAssetsService, useValue: { baseUrl: 'https://example.test/jutsu/assets/' } },
    ] });
    const templates = TestBed.inject(PdfTemplatesService);
    expect(templates.options).toHaveLength(1);
    expect(templates.selectedId()).toBe('jutsu-fichas-rellenables');
    const template = templates.getTemplate(templates.selectedId());
    expect(template.configUrl).toBe('https://example.test/jutsu/assets/pdf/fichas_rellenables_coordenadas.json');
    expect(template.pdfUrl).toBe('https://example.test/jutsu/assets/pdf/fichas_rellenables.pdf');
    expect(template.fontUrls['Eagle Lake']).toContain('/jutsu/assets/fonts/Eagle_Lake/');
  });

  it('changes the template independently of the band and rejects unknown IDs', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PDF_TEMPLATE_OPTIONS, useValue: [
      { id: 'first', label: 'First', create: () => ({ configUrl: '/first.json', fontUrls: {} }) },
      { id: 'second', label: 'Second', create: () => ({ configUrl: '/second.json', fontUrls: {} }) },
    ] }] });
    const templates = TestBed.inject(PdfTemplatesService);
    const state = TestBed.inject(BandStateService);
    state.setBandName('Cuervos');
    const band = state.band();
    templates.select('second');
    expect(templates.selected().label).toBe('Second');
    expect(templates.getTemplate('second').configUrl).toBe('/second.json');
    expect(state.band()).toBe(band);
    expect(() => templates.select('unknown')).toThrow('Unknown PDF template');
    expect(templates.selectedId()).toBe('second');
    const revision = templates.revision();
    templates.select('second');
    expect(templates.revision()).toBe(revision);
  });
});
