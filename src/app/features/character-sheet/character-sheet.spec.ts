import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CharacterSheet } from './character-sheet';
import { BandState } from './band-state';
import { GENERATE_BAND_PDF } from '../pdf-generator/pdf-generation';
import { PdfBrowserFiles } from '../pdf-generator/pdf-browser-files';
import { PdfTemplates } from '../pdf-generator/pdf-templates';

async function setup() {
  const generate = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
  const files = { download: vi.fn(), openForPrinting: vi.fn() };
  TestBed.configureTestingModule({ imports: [CharacterSheet], providers: [
    { provide: GENERATE_BAND_PDF, useValue: generate },
    { provide: PdfBrowserFiles, useValue: files },
  ] });
  const fixture = TestBed.createComponent(CharacterSheet);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const state = TestBed.inject(BandState);
  const select = async (id: string, value: string) => {
    const control = element.querySelector<HTMLSelectElement>(`#${id}`)!;
    control.value = value;
    control.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
  };
  const click = async (label: string) => {
    element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click();
    await fixture.whenStable();
  };
  return { fixture, element, state, select, click, generate, files };
}

describe('Character sheet', () => {
  it('edits independent ninjas and displays catalog stats and all three techniques', async () => {
    const { fixture, element, state, select } = await setup();
    expect(element.querySelectorAll('.ninja-editor')).toHaveLength(3);
    const name = element.querySelector<HTMLInputElement>('#ninja-1-name')!;
    name.value = 'Águila';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    await select('ninja-1-type', 'Physical');
    await select('ninja-1-technique-group', 'Taijutsu');
    expect(state.band().ninjas[0].name).toBe('Águila');
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
    expect(name.value).toBe('Águila');
  });

  it('keeps equipment limits, derived details and keyboard focus after add/remove', async () => {
    const { element, state, select, click } = await setup();
    await click('Add weapon to Ninja 1');
    expect(document.activeElement?.id).toBe('ninja-1-weapon-1-name');
    await select('ninja-1-weapon-1-name', 'Kunai');
    expect(element.querySelector('.equipment-details')!.textContent).toContain('2D6 ranged attack.');
    expect(element.querySelector('.equipment-details')!.textContent).toContain('1 action');
    await click('Add weapon to Ninja 1');
    await click('Add weapon to Ninja 1');
    expect(element.querySelector<HTMLButtonElement>('[aria-label="Add weapon to Ninja 1"]')!.disabled).toBe(true);
    await click('Add item to Ninja 1');
    await click('Add item to Ninja 1');
    expect(element.querySelector<HTMLButtonElement>('[aria-label="Add item to Ninja 1"]')!.disabled).toBe(true);
    expect(state.band().ninjas[0].equipment.weapons).toHaveLength(3);
    await click('Remove weapon 2 from Ninja 1');
    expect(document.activeElement?.id).toBe('ninja-1-weapon-2-name');
    expect(state.band().ninjas[0].equipment.weapons).toHaveLength(2);
    expect(element.querySelector<HTMLButtonElement>('[aria-label="Add weapon to Ninja 1"]')!.disabled).toBe(false);
  });

  it('generates and downloads the current form snapshot through the button', async () => {
    const { fixture, element, state, generate, files } = await setup();
    state.setName(2, 'Kaede');
    element.querySelector<HTMLButtonElement>('#generate-pdf')!.click();
    await fixture.whenStable();
    const templates = TestBed.inject(PdfTemplates);
    expect(generate).toHaveBeenCalledWith(state.band(), templates.getTemplate(templates.selectedId()));
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
    name.value = 'Los Cuervos';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(state.band().name).toBe('Los Cuervos');
    element.querySelector<HTMLButtonElement>('#generate-pdf')!.click();
    await fixture.whenStable();
    expect(element.querySelector('.pdf-file-name')!.textContent).toBe('Los-Cuervos.pdf');
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'Los-Cuervos.pdf');
    expect(download.disabled).toBe(false);
    expect(print.disabled).toBe(false);
    download.click();
    await fixture.whenStable();
    expect(files.download).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70]), 'Los-Cuervos.pdf');
    expect(files.download).toHaveBeenCalledTimes(2);
    print.click();
    await fixture.whenStable();
    expect(files.openForPrinting).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70]));
    name.value = 'Águilas';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(download.disabled).toBe(true);
    expect(print.disabled).toBe(true);
    expect(element.querySelector('.pdf-file-name')).toBeNull();
    expect(element.querySelector('#pdf-status')!.textContent).toBe('Ready to generate your sheet.');
  });
});
