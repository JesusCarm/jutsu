import { I18nService } from '../../core/i18n/i18n.service';
import { provideTestI18n } from '../../../../tests/fixtures/i18n-testing';
import { GameTextService } from '../../core/i18n/game-text.service';
import { Labels } from '../../core/i18n/i18n-keys';
import spanish from '../../../../public/i18n/es.json';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CharacterSheetComponent } from './character-sheet.component';
import { BandStateService } from './band-state.service';
import { GENERATE_BAND_PDF } from '../pdf-generator/pdf-generation.service';
import { PdfBrowserFilesService } from '../pdf-generator/pdf-browser-files.service';
import { PdfTemplatesService } from '../pdf-generator/pdf-templates.service';
import { PdfGenerationService } from '../pdf-generator/pdf-generation.service';

async function setup() {
  const generate = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
  const files = { download: vi.fn(), openForPrinting: vi.fn() };
  TestBed.configureTestingModule({ imports: [CharacterSheetComponent], providers: [
    ...provideTestI18n(),
    { provide: GENERATE_BAND_PDF, useValue: generate },
    { provide: PdfBrowserFilesService, useValue: files },
  ] });
  await TestBed.inject(I18nService).initialize();
  const fixture = TestBed.createComponent(CharacterSheetComponent);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const state = TestBed.inject(BandStateService);
  const select = async (id: string, value: string) => {
    const control = element.querySelector<HTMLSelectElement>(`#${id}`)!;
    control.value = value;
    control.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
  };
  return { fixture, element, state, select, generate, files };
}

describe('Character sheet', () => {
  it('switches languages through the header without recreating controls or changing game data', async () => {
    const { fixture, element, state, select } = await setup();
    const name = element.querySelector<HTMLInputElement>('#ninja-1-name')!;
    name.value = 'Renée';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await select('ninja-1-type', 'physical');
    await select('ninja-1-technique-group', 'taijutsu');
    await select('ninja-1-item-2-name', 'smokeBomb');
    const type = element.querySelector<HTMLSelectElement>('#ninja-1-type')!;
    type.focus();
    const band = state.band();
    const revision = state.revision();
    const es = element.querySelector<HTMLButtonElement>('[data-language="es"]')!;
    const en = element.querySelector<HTMLButtonElement>('[data-language="en"]')!;
    expect(es.title).toBe('Switch to Spanish');
    expect(es.getAttribute('aria-label')).toBe(es.title);
    es.click();
    await fixture.whenStable();
    expect(es.getAttribute('aria-pressed')).toBe('true');
    expect(en.getAttribute('aria-pressed')).toBe('false');
    expect(element.querySelector('.editor-subtitle')!.textContent).toBe('Editor de escuadra');
    expect(element.textContent).toContain(spanish.techniques.protectiveGate.name);
    expect(element.textContent).toContain(spanish.techniques.gateOfSpeed.name);
    expect(element.querySelector('#ninja-1-item-2-name')!.textContent).toContain(spanish.items.smokeBomb.name);
    expect(state.band()).toBe(band);
    expect(state.revision()).toBe(revision);
    expect(element.querySelector('#ninja-1-name')).toBe(name);
    expect(element.querySelector('#ninja-1-type')).toBe(type);
    expect(name.value).toBe('Renée');
    expect(type.value).toBe('physical');
    expect(document.activeElement).toBe(type);
    en.click();
    await fixture.whenStable();
    expect(element.textContent).toContain('Protective Gate');
    expect(state.band()).toBe(band);
  });

  afterEach(() => vi.unstubAllGlobals());
  it('edits independent ninjas and displays catalog stats and all three techniques', async () => {
    const { fixture, element, state, select } = await setup();
    expect(element.querySelectorAll('.ninja-editor')).toHaveLength(3);
    const name = element.querySelector<HTMLInputElement>('#ninja-1-name')!;
    name.value = 'Renée';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    await select('ninja-1-type', 'physical');
    await select('ninja-1-technique-group', 'taijutsu');
    expect(state.band().ninjas[0].name).toBe('Renée');
    expect(state.band().ninjas[0].stats.attack).toBe(6);
    expect(element.querySelector('.stat-fields')!.textContent).toContain('6');
    expect(element.querySelectorAll('.technique-card')).toHaveLength(3);
    expect(element.textContent).toContain('Protective Gate');
    expect(element.textContent).toContain('1–5');
    expect(state.band().ninjas[1].type).toBe('');
    await select('ninja-1-type', '');
    await select('ninja-1-technique-group', '');
    expect(state.band().ninjas[0].stats.attack).toBeNull();
    expect(element.querySelectorAll('.technique-card')).toHaveLength(0);
    expect(name.value).toBe('Renée');
  });

  it('offers three weapon and two item slots and keeps focus and other slots when clearing one', async () => {
    const { element, state, select } = await setup();
    expect(element.querySelectorAll('#ninja-1-panel .equipment-row')).toHaveLength(5);
    const third = element.querySelector<HTMLSelectElement>('#ninja-1-weapon-3-name')!;
    third.focus();
    await select('ninja-1-weapon-3-name', 'shuriken');
    expect(document.activeElement).toBe(third);
    expect(state.band().ninjas[0].equipment.weapons.map((entry) => entry.id)).toEqual(['', '', 'shuriken']);
    await select('ninja-1-weapon-1-name', 'kunai');
    await select('ninja-1-weapon-2-name', 'explosiveSeal');
    await select('ninja-1-item-2-name', 'smokeBomb');
    expect(state.band().ninjas[0].equipment.weapons).toHaveLength(3);
    expect(state.band().ninjas[0].equipment.items).toHaveLength(2);
    expect(element.querySelector('.equipment-details')!.textContent).toContain('2D6 ranged attack.');
    expect(element.querySelector('.equipment-details')!.textContent).toContain('1 action');
    const summary = element.querySelector('app-ninja-summary')!;
    expect(summary.querySelectorAll('.equipment-token:not(.is-empty)')).toHaveLength(4);
    expect(summary.querySelector<HTMLImageElement>('[data-equipment="kunai"] img')!.src).toContain('/assets/icons/kunai.svg');
    expect(summary.querySelector<HTMLImageElement>('[data-equipment="smokeBomb"] img')!.src).toContain('/assets/icons/bomba_humo.svg');
    expect(summary.querySelector('.is-empty svg path')).not.toBeNull();
    expect(summary.querySelector('[data-equipment="smokeBomb"]')).not.toBeNull();
    await select('ninja-1-weapon-2-name', '');
    expect(state.band().ninjas[0].equipment.weapons.map((entry) => entry.id)).toEqual(['kunai', '', 'shuriken']);
    expect(third.value).toBe('shuriken');
    expect(summary.querySelector('[data-equipment="explosiveSeal"]')).toBeNull();
    await select('ninja-1-weapon-3-name', '');
    expect(state.band().ninjas[0].equipment.weapons).toHaveLength(1);
    expect(element.querySelectorAll('#ninja-1-panel .equipment-row')).toHaveLength(5);
    expect(state.band().ninjas[1].equipment.weapons).toHaveLength(0);
  });

  it('updates all six stats in the associated mini sheet without editable stat controls', async () => {
    const { element, select } = await setup();
    await select('ninja-1-type', 'physical');
    await select('ninja-2-type', 'defensive');
    await select('ninja-3-type', 'jutsuMaster');
    const summaries = element.querySelectorAll('app-ninja-summary');
    expect(summaries).toHaveLength(3);
    const stats = [...summaries[0].querySelectorAll('.stat-value')].map((value) => value.textContent);
    expect(stats).toEqual(['12', '6', '5', '7', '4', '10']);
    expect(summaries[1].querySelector('[data-stat="defense"] .stat-value')!.textContent).toBe('6');
    expect(summaries[2].querySelector('[data-stat="chakra"] .stat-value')!.textContent).toBe('20');
    expect(element.querySelectorAll('input[type="number"]')).toHaveLength(0);
    expect(summaries[0].querySelectorAll('.mini-stat app-ui-icon')).toHaveLength(6);
    expect(summaries[0].querySelector<HTMLImageElement>('[data-stat="health"] img')!.src).toContain('/assets/icons/vida_ico.svg');
    for (const [index, file] of ['fisico.svg', 'defensivo.svg', 'jutsu_master.svg'].entries()) {
      expect(summaries[index].querySelector<HTMLImageElement>('.ninja-type img')!.src).toContain('/assets/icons/' + file);
    }
    await select('ninja-1-type', 'offensive');
    expect(summaries[0].querySelector<HTMLImageElement>('.ninja-type img')!.src).toContain('/assets/icons/ofensivo.svg');
    expect(element.querySelector<HTMLImageElement>('#ninja-1-panel .editor-heading .badge img')!.src).toContain('/assets/icons/ofensivo.svg');
    await select('ninja-1-type', '');
    expect(summaries[0].querySelector('.ninja-type img')).toBeNull();
    expect(element.querySelector('#ninja-1-panel .editor-heading .badge img')).toBeNull();
  });

  it('switches the active editor without recreating forms, changing band data or invalidating the PDF', async () => {
    const { fixture, element, state, files } = await setup();
    state.setName(0, 'Kragash');
    state.setName(2, 'Zikka');
    await fixture.whenStable();
    const firstName = element.querySelector<HTMLInputElement>('#ninja-1-name')!;
    const thirdName = element.querySelector<HTMLInputElement>('#ninja-3-name')!;
    element.querySelector<HTMLButtonElement>('#generate-pdf')!.click();
    await fixture.whenStable();
    const band = state.band();
    const revision = state.revision();
    element.querySelector<HTMLButtonElement>('#ninja-3-select')!.click();
    await fixture.whenStable();
    expect(element.querySelectorAll('.ninja-column.is-selected')).toHaveLength(1);
    expect(element.querySelector('.is-selected .ninja-panel')!.id).toBe('ninja-3-panel');
    expect(element.querySelector('#ninja-3-select')!.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('#ninja-1-select')!.getAttribute('aria-pressed')).toBe('false');
    expect(state.band()).toBe(band);
    expect(state.revision()).toBe(revision);
    expect(TestBed.inject(PdfGenerationService).hasPdf()).toBe(true);
    expect(files.download).toHaveBeenCalledTimes(1);
    expect(element.querySelector('#ninja-3-name')).toBe(thirdName);
    element.querySelector<HTMLButtonElement>('#ninja-1-select')!.click();
    await fixture.whenStable();
    expect(element.querySelector('#ninja-1-name')).toBe(firstName);
    expect(firstName.value).toBe('Kragash');
    expect(thirdName.value).toBe('Zikka');
  });

  it('ignores desktop mini-sheet clicks and keeps mobile selection available after resizing', async () => {
    let desktop = true;
    const matchMedia = vi.fn(() => ({ matches: desktop }) as MediaQueryList);
    vi.stubGlobal('matchMedia', matchMedia);
    const { fixture, element, state } = await setup();
    const band = state.band();
    const third = element.querySelectorAll('app-ninja-summary')[2];
    third.querySelector<HTMLButtonElement>('.ninja-select')!.click();
    third.querySelector<HTMLElement>('.equipment-token')!.click();
    await fixture.whenStable();
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 56rem)');
    expect(element.querySelector('.is-selected .ninja-panel')!.id).toBe('ninja-1-panel');
    desktop = false;
    third.querySelector<HTMLButtonElement>('.ninja-select')!.click();
    await fixture.whenStable();
    expect(element.querySelector('.is-selected .ninja-panel')!.id).toBe('ninja-3-panel');
    desktop = true;
    element.querySelector<HTMLButtonElement>('#ninja-1-select')!.click();
    await fixture.whenStable();
    expect(element.querySelector('.is-selected .ninja-panel')!.id).toBe('ninja-3-panel');
    expect(state.band()).toBe(band);
  });

  it('generates and downloads the current form snapshot through the button', async () => {
    const { fixture, element, state, generate, files } = await setup();
    state.setName(2, 'Kaede');
    element.querySelector<HTMLButtonElement>('#generate-pdf')!.click();
    await fixture.whenStable();
    const templates = TestBed.inject(PdfTemplatesService);
    expect(generate).toHaveBeenCalledWith(TestBed.inject(GameTextService).snapshot().band(state.band()), templates.getTemplate(templates.selectedId()));
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'jutsu-squad.pdf');
    expect(element.querySelector('#pdf-status')!.textContent).toBe('Download started.');
    expect(element.querySelector<HTMLButtonElement>('#generate-pdf')!.disabled).toBe(false);
  });

  it('exports the named squad and disables exports again after editing', async () => {
    const { fixture, element, state, files } = await setup();
    const download = element.querySelector<HTMLButtonElement>('#download-pdf')!;
    const print = element.querySelector<HTMLButtonElement>('#print-pdf')!;
    expect(download.disabled).toBe(true);
    expect(print.disabled).toBe(true);
    const templates = element.querySelector<HTMLSelectElement>('#pdf-template')!;
    expect(templates.options).toHaveLength(1);
    expect(templates.value).toBe('jutsu-fichas-rellenables');
    const name = element.querySelector<HTMLInputElement>('#band-name')!;
    name.value = 'The Ravens';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(state.band().name).toBe('The Ravens');
    element.querySelector<HTMLButtonElement>('#generate-pdf')!.click();
    await fixture.whenStable();
    expect(element.querySelector('.pdf-file-name')!.textContent).toBe('jutsu-squad-The-Ravens.pdf');
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'jutsu-squad-The-Ravens.pdf');
    expect(download.disabled).toBe(false);
    expect(print.disabled).toBe(false);
    download.click();
    await fixture.whenStable();
    expect(files.download).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70]), 'jutsu-squad-The-Ravens.pdf');
    expect(files.download).toHaveBeenCalledTimes(2);
    print.click();
    await fixture.whenStable();
    expect(files.openForPrinting).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70]));
    name.value = 'Renamed squad';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(download.disabled).toBe(true);
    expect(print.disabled).toBe(true);
    expect(element.querySelector('.pdf-file-name')).toBeNull();
    expect(element.querySelector('#pdf-status')!.textContent).toBe('Ready to generate your sheet.');
  });
});
