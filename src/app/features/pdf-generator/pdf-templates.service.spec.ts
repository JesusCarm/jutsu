import { Labels } from '../../core/i18n/i18n-keys';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PlatformAssetsService } from '../../core/services/platform-assets.service';
import { BandStateService } from '../character-sheet/band-state.service';
import { PDF_TEMPLATE_OPTIONS, PdfTemplatesService } from './pdf-templates.service';

describe('Available PDF templates', () => {
  it('uses a locale-specific template when configured and falls back to the shared design', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PDF_TEMPLATE_OPTIONS, useValue: [{
      id: 'localized', labelKey: Labels.jutsuTemplate,
      create: () => ({ configUrl: '/shared.json', fontUrls: {} }),
      localized: { es: () => ({ configUrl: '/spanish.json', fontUrls: {} }) },
    }] }] });
    const templates = TestBed.inject(PdfTemplatesService);
    expect(templates.getTemplate('localized', 'es').configUrl).toBe('/spanish.json');
    expect(templates.getTemplate('localized', 'en').configUrl).toBe('/shared.json');
  });

  it('offers the original sheet and card view with local resources under the app base path', () => {
    TestBed.configureTestingModule({ providers: [
      { provide: PlatformAssetsService, useValue: { baseUrl: 'https://example.test/jutsu/assets/' } },
    ] });
    const templates = TestBed.inject(PdfTemplatesService);
    expect(templates.options.map((option) => option.id)).toEqual(['jutsu-fichas-rellenables', 'ninja-grid']);
    expect(templates.selectedId()).toBe('jutsu-fichas-rellenables');
    const template = templates.getTemplate(templates.selectedId());
    expect(template.configUrl).toBe('https://example.test/jutsu/assets/pdf/fichas_rellenables_coordenadas.json');
    expect(template.pdfUrl).toBe('https://example.test/jutsu/assets/pdf/fichas_rellenables.pdf');
    expect(template.fontUrls['Eagle Lake']).toContain('/jutsu/assets/fonts/Eagle_Lake/');
    templates.select('ninja-grid');
    const grid = templates.getTemplate('ninja-grid');
    expect(grid.ninjaGrid).toBe(true);
    expect(grid.configUrl).toBeUndefined();
    expect(grid.fontUrls['DejaVu Sans']).toContain('/jutsu/assets/fonts/DejaVu_Sans/');
    expect(grid.iconUrls?.attack).toBe('https://example.test/jutsu/assets/icons/ataque_ico.svg');
  });

  it('changes the template independently of the band and rejects unknown IDs', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PDF_TEMPLATE_OPTIONS, useValue: [
      { id: 'first', labelKey: Labels.jutsuTemplate, create: () => ({ configUrl: '/first.json', fontUrls: {} }) },
      { id: 'second', labelKey: Labels.sheetTemplate, create: () => ({ configUrl: '/second.json', fontUrls: {} }) },
    ] }] });
    const templates = TestBed.inject(PdfTemplatesService);
    const state = TestBed.inject(BandStateService);
    state.setBandName('Cuervos');
    const band = state.band();
    templates.select('second');
    expect(templates.selected().labelKey).toBe(Labels.sheetTemplate);
    expect(templates.getTemplate('second').configUrl).toBe('/second.json');
    expect(state.band()).toBe(band);
    expect(() => templates.select('unknown')).toThrow('Unknown PDF template');
    expect(templates.selectedId()).toBe('second');
    const revision = templates.revision();
    templates.select('second');
    expect(templates.revision()).toBe(revision);
  });
});
