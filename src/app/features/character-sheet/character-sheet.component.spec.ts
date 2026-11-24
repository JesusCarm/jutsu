import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { afterEach, describe, expect, it, vi } from 'vitest';
import spanish from '../../../../public/i18n/es.json';
import { I18nService } from '../../core/i18n/i18n.service';
import { provideTestI18n } from '../../../../tests/fixtures/i18n-testing';
import { CharacterSheetComponent } from './character-sheet.component';
import { BandStateService } from './band-state.service';
import { GENERATE_BAND_PDF, PdfGenerationService } from '../pdf-generator/pdf-generation.service';
import { PdfBrowserFilesService } from '../pdf-generator/pdf-browser-files.service';

async function setup() {
  const generate = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
  const viewer = { show: vi.fn(), close: vi.fn() };
  const files = { download: vi.fn(), openForPrinting: vi.fn(), prepareForPrinting: vi.fn(() => viewer) };
  TestBed.configureTestingModule({ imports: [CharacterSheetComponent], providers: [
    ...provideTestI18n(), { provide: GENERATE_BAND_PDF, useValue: generate },
    { provide: PdfBrowserFilesService, useValue: files },
  ] });
  await TestBed.inject(I18nService).initialize();
  const fixture = TestBed.createComponent(CharacterSheetComponent);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const overlay = TestBed.inject(OverlayContainer).getContainerElement();
  const state = TestBed.inject(BandStateService);
  const open = async (id: string) => {
    const button = element.querySelector<HTMLButtonElement>(`#${id}`)!;
    button.focus(); button.click();
    await fixture.whenStable();
    expect(overlay.querySelector('[role="dialog"]')).not.toBeNull();
    return button;
  };
  const pick = async (id: string) => {
    overlay.querySelector<HTMLButtonElement>(`[data-option-id="${id}"]`)!.click();
    await fixture.whenStable();
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
  };
  const choose = async (trigger: string, id: string) => { await open(trigger); await pick(id); };
  const input = async (id: string, value: string) => {
    const control = element.querySelector<HTMLInputElement>(`#${id}`)!;
    control.value = value; control.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    return control;
  };
  return { fixture, element, overlay, state, generate, files, viewer, open, pick, choose, input };
}

describe('Compact character sheet', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('chooses all four types with their stats, restores focus and clears the current selection', async () => {
    const { element, overlay, state, open, pick } = await setup();
    expect(element.querySelector('#ninja-1-type')!.textContent).toContain('Choose type');
    expect(element.querySelectorAll('.ninja-editor input, .ninja-editor select, input[type="number"]')).toHaveLength(0);
    const profiles = [
      ['physical', 'fisico.svg', [12, 6, 5, 7, 4, 10]],
      ['defensive', 'defensivo.svg', [15, 4, 6, 5, 5, 10]],
      ['offensive', 'ofensivo.svg', [15, 8, 3, 7, 4, 10]],
      ['jutsuMaster', 'jutsu_master.svg', [20, 5, 4, 5, 5, 10]],
    ] as const;
    for (const [id, icon, stats] of profiles) {
      const trigger = await open('ninja-1-type');
      expect(overlay.querySelectorAll('[data-option-id]:not([data-option-id=""])')).toHaveLength(4);
      expect(overlay.querySelectorAll('.mini-stat')).toHaveLength(24);
      expect(overlay.querySelector(`[data-option-id="${state.band().ninjas[0].type}"]`)!.getAttribute('aria-pressed')).toBe('true');
      await pick(id);
      expect(document.activeElement).toBe(trigger);
      expect(state.band().ninjas[0].type).toBe(id);
      expect(state.band().ninjas[1].type).toBe('');
      expect(trigger.querySelector<HTMLImageElement>('img')!.src).toContain('/assets/icons/' + icon);
      expect([...element.querySelector('app-ninja-summary')!.querySelectorAll('.stat-value')].map((node) => Number(node.textContent))).toEqual(stats);
    }
    await open('ninja-1-type'); await pick('');
    expect(state.band().ninjas[0].stats.attack).toBeNull();
    expect(element.querySelector('#ninja-1-type img')).toBeNull();
  });

  it('edits three weapon and two item slots independently and preserves equipment effects', async () => {
    const { element, overlay, state, open, pick, choose } = await setup();
    const summary = element.querySelector('app-ninja-summary')!;
    expect(summary.querySelectorAll('button.equipment-token')).toHaveLength(5);
    await open('ninja-1-weapons-3');
    expect(overlay.querySelectorAll('[data-option-id]:not([data-option-id=""])')).toHaveLength(3);
    expect(overlay.textContent).toContain('2D6 ranged attack.');
    expect(overlay.textContent).toContain('2 actions');
    await pick('shuriken');
    await choose('ninja-1-weapons-1', 'kunai');
    await choose('ninja-1-weapons-2', 'explosiveSeal');
    await open('ninja-1-items-2');
    expect(overlay.querySelectorAll('[data-option-id]:not([data-option-id=""])')).toHaveLength(4);
    await pick('smokeBomb');
    expect(state.band().ninjas[0].equipment.weapons.map((entry) => entry.id)).toEqual(['kunai', 'explosiveSeal', 'shuriken']);
    expect(state.band().ninjas[0].equipment.items.map((entry) => entry.id)).toEqual(['', 'smokeBomb']);
    expect(summary.querySelector<HTMLImageElement>('[data-equipment="kunai"] img')!.src).toContain('/assets/icons/kunai.svg');
    expect(element.querySelector('.equipment-details')!.textContent).toContain('2D6 ranged attack.');
    expect(element.querySelector('.equipment-details')!.textContent).toContain('1 action');
    await choose('ninja-1-weapons-2', '');
    expect(state.band().ninjas[0].equipment.weapons.map((entry) => entry.id)).toEqual(['kunai', '', 'shuriken']);
    expect(summary.querySelectorAll('button.equipment-token')).toHaveLength(5);
    expect(state.band().ninjas[1].equipment.weapons).toHaveLength(0);
    await choose('ninja-1-weapons-3', 'kunai');
    expect(state.band().ninjas[0].equipment.weapons[2].id).toBe('kunai');
  });

  it('previews all schools and retains the selected techniques with descriptions, costs and Mokushin', async () => {
    const { element, overlay, state, open, pick, choose } = await setup();
    expect(element.querySelector('#ninja-1-technique-group')!.textContent).toContain('Select school');
    await open('ninja-1-technique-group');
    expect(overlay.querySelectorAll('.school-option')).toHaveLength(12);
    expect(overlay.querySelectorAll('.technique-card')).toHaveLength(36);
    expect(overlay.textContent).toContain('Protective Gate');
    expect(overlay.textContent).toContain('1–5');
    await pick('taijutsu');
    expect(state.band().ninjas[0].techniqueGroup.id).toBe('taijutsu');
    expect(element.querySelector<HTMLImageElement>('#ninja-1-technique-group img')!.src).toContain('/assets/icons/escuela_jutsu.svg');
    expect(element.querySelector('#ninja-1-technique-group')!.getAttribute('title')).toBe('Taijutsu');
    expect(element.querySelectorAll('#ninja-1-panel .technique-card')).toHaveLength(3);
    expect(element.querySelector('#ninja-1-panel .mokushin-badge')).not.toBeNull();
    await choose('ninja-1-technique-group', 'medical');
    expect(element.querySelector('#ninja-1-panel')!.textContent).toContain('Surgery');
    expect(element.querySelector('#ninja-1-panel')!.textContent).not.toContain('Protective Gate');
    await choose('ninja-1-technique-group', '');
    expect(element.querySelectorAll('#ninja-1-panel .technique-card')).toHaveLength(0);
  });

  it('dismisses by close, backdrop and Escape without changing data or invalidating the PDF', async () => {
    const { fixture, overlay, state, open } = await setup();
    const pdf = TestBed.inject(PdfGenerationService);
    await pdf.generate();
    const band = state.band(); const revision = state.revision();
    for (const dismiss of ['close', 'backdrop', 'escape']) {
      const trigger = await open('ninja-2-type');
      expect(overlay.querySelector('[role="dialog"]')!.getAttribute('aria-modal')).toBe('true');
      if (dismiss === 'close') overlay.querySelector<HTMLButtonElement>('.close-panel')!.click();
      else if (dismiss === 'backdrop') overlay.querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
      else document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      await fixture.whenStable();
      expect(overlay.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(state.band()).toBe(band); expect(state.revision()).toBe(revision);
      expect(pdf.hasPdf()).toBe(true);
    }
  });

  it('edits names in place and switches mobile details without recreating controls or changing data', async () => {
    const { fixture, element, state, input } = await setup();
    const first = await input('ninja-1-name', 'Kragash');
    const third = await input('ninja-3-name', 'Zikka');
    const band = state.band(); const revision = state.revision();
    element.querySelector<HTMLButtonElement>('#ninja-3-select')!.click();
    await fixture.whenStable();
    expect(element.querySelector('.is-selected .ninja-panel')!.id).toBe('ninja-3-panel');
    expect(element.querySelector('#ninja-3-panel .editor-heading')!.textContent).toBe('Zikka');
    expect(element.querySelector('#ninja-1-name')).toBe(first);
    expect(element.querySelector('#ninja-3-name')).toBe(third);
    expect(state.band()).toBe(band); expect(state.revision()).toBe(revision);
  });

  it('keeps desktop summaries independent while their buttons edit the correct ninja', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true }) as MediaQueryList));
    const { fixture, element, state, choose } = await setup();
    element.querySelector<HTMLButtonElement>('#ninja-3-select')!.click();
    await fixture.whenStable();
    expect(element.querySelector('.is-selected .ninja-panel')!.id).toBe('ninja-1-panel');
    await choose('ninja-3-type', 'offensive');
    expect(state.band().ninjas[2].stats.attack).toBe(8);
    expect(state.band().ninjas[0].type).toBe('');
  });

  it('updates language in the UI and dialogs without losing controls or selections', async () => {
    const { fixture, element, overlay, state, input, choose, open } = await setup();
    const name = await input('ninja-1-name', 'Renée');
    await choose('ninja-1-type', 'physical');
    await choose('ninja-1-technique-group', 'taijutsu');
    await choose('ninja-1-items-2', 'smokeBomb');
    const band = state.band(); const revision = state.revision();
    element.querySelector<HTMLButtonElement>('[data-language="es"]')!.click();
    await fixture.whenStable();
    expect(element.querySelector('#ninja-1-type')!.textContent).toContain(spanish.ninjaTypes.physical);
    expect(element.querySelector('#ninja-1-panel')!.textContent).toContain(spanish.techniques.protectiveGate.name);
    expect(element.querySelector('#ninja-1-name')).toBe(name); expect(name.value).toBe('Renée');
    expect(state.band()).toBe(band); expect(state.revision()).toBe(revision);
    await open('ninja-2-type');
    expect(overlay.textContent).toContain('Escoger tipo de ninja');
    expect(overlay.textContent).toContain(spanish.stats.attack);
  });

  it('prints from the first click and generates again after edits, with no redundant download button', async () => {
    const { fixture, element, generate, files, viewer, input } = await setup();
    const print = element.querySelector<HTMLButtonElement>('#print-pdf')!;
    expect(print.disabled).toBe(false); expect(element.querySelector('#download-pdf')).toBeNull();
    print.click();
    expect(files.prepareForPrinting).toHaveBeenCalledTimes(1);
    await fixture.whenStable();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(viewer.show).toHaveBeenCalledWith(new Uint8Array([37, 80, 68, 70]));
    expect(files.download).not.toHaveBeenCalled();
    await input('ninja-1-name', 'Updated');
    expect(print.disabled).toBe(false);
    print.click(); await fixture.whenStable();
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls[1][0].ninjas[0].name).toBe('Updated');
  });

  it('generates and downloads a named squad through the remaining export action', async () => {
    const { fixture, element, files, input } = await setup();
    await input('band-name', 'The Ravens');
    element.querySelector<HTMLButtonElement>('#generate-pdf-bottom')!.click();
    await fixture.whenStable();
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'jutsu-squad-The-Ravens.pdf');
    expect(element.querySelector('#pdf-status')!.textContent).toBe('Download started.');
  });
});
