import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { describe, expect, it, vi } from 'vitest';
import { provideTestI18n } from '../../../../../tests/fixtures/i18n-testing';
import type { Language } from '../../../core/i18n/languages';
import { I18nService } from '../../../core/i18n/i18n.service';
import { CharacterSheetComponent } from '../../character-sheet/character-sheet.component';
import { BandStateService } from '../../character-sheet/band-state.service';
import { GENERATE_BAND_PDF, PdfGenerationService } from '../../pdf-generator/pdf-generation.service';
import { RULE_DOCUMENT_FETCH, RulesService } from '../rules.service';
import { STAT_RULES } from '../rule-references';
import { RuleDialogsService } from '../rule-dialogs.service';
import { readRuleDocument } from '../rule-document';

async function setup(language: Language = 'en') {
  const fetchDocument = vi.fn(async (url: string) => readFileSync(resolve('src/assets', new URL(url).pathname.split('/assets/')[1]), 'utf8'));
  TestBed.configureTestingModule({ imports: [CharacterSheetComponent], providers: [
    ...provideTestI18n(), { provide: RULE_DOCUMENT_FETCH, useValue: fetchDocument },
    { provide: GENERATE_BAND_PDF, useValue: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])) },
  ] });
  const i18n = TestBed.inject(I18nService);
  await i18n.initialize();
  if (language !== i18n.lang()) await i18n.setLanguage(language);
  const fixture = TestBed.createComponent(CharacterSheetComponent);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const overlay = TestBed.inject(OverlayContainer).getContainerElement();
  const state = TestBed.inject(BandStateService);
  const click = async (button: HTMLButtonElement) => { button.focus(); button.click(); await fixture.whenStable(); };
  const loaded = async (id: string) => {
    await vi.waitFor(() => expect(overlay.querySelector(`[data-rule-section="${id}"]`)).not.toBeNull());
    await fixture.whenStable();
  };
  const close = async () => { await click(overlay.querySelector<HTMLButtonElement>('.rule-close')!); };
  return { fixture, element, overlay, state, i18n, fetchDocument, click, loaded, close };
}

describe('Contextual rule dialogs', () => {
  it('opens all six attribute references with accessible help labels and preserves the squad and PDF', async () => {
    const { fixture, element, overlay, state, fetchDocument, click, loaded, close } = await setup();
    state.selectType(0, 'physical');
    await fixture.whenStable();
    const pdf = TestBed.inject(PdfGenerationService);
    await pdf.generate();
    const band = state.band(); const revision = state.revision();
    expect(fetchDocument).not.toHaveBeenCalled();
    for (const [stat, rule] of Object.entries(STAT_RULES)) {
      const trigger = element.querySelector<HTMLButtonElement>(`app-ninja-summary [data-stat="${stat}"] .rule-help`)!;
      expect(trigger.getAttribute('aria-label')).toContain('View rules:');
      expect(trigger.title).toBe(trigger.getAttribute('aria-label'));
      await click(trigger); await loaded(rule);
      const dialog = overlay.querySelector('[id="rules-dialog"]')!;
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBe('rule-dialog-title');
      expect(overlay.querySelector('.rule-icon')).not.toBeNull();
      await close();
      expect(document.activeElement).toBe(trigger);
      expect(state.band()).toBe(band); expect(state.revision()).toBe(revision); expect(pdf.hasPdf()).toBe(true);
    }
  });

  it('navigates related rules and inline keywords in one dialog, shows diagrams, and goes back', async () => {
    const { element, overlay, click, loaded, close } = await setup();
    await click(element.querySelector<HTMLButtonElement>('app-ninja-summary [data-rule-id="movement-stat"]')!);
    await loaded('movement-stat');
    await vi.waitFor(() => expect(overlay.querySelector('[data-related-rule="charge"]')).not.toBeNull());
    await click(overlay.querySelector<HTMLButtonElement>('[data-related-rule="charge"]')!); await loaded('charge');
    expect(overlay.querySelector<HTMLImageElement>('.rule-diagram')!.src).toContain('/assets/diagrams/en/charge.svg');
    expect(overlay.querySelector<HTMLImageElement>('.rule-diagram')!.alt).toContain('Charge');
    await click(overlay.querySelector<HTMLButtonElement>('.rule-content [data-rule-id="interaction-distance"]')!);
    await loaded('interaction-distance');
    expect(overlay.querySelectorAll('#rules-dialog')).toHaveLength(1);
    expect(overlay.querySelector('article')!.getAttribute('lang')).toBe('en');
    expect(overlay.querySelector<HTMLImageElement>('.rule-diagram')!.src).toContain('/assets/diagrams/di.svg');
    await click(overlay.querySelector<HTMLButtonElement>('.rule-back')!); await loaded('charge');
    await click(overlay.querySelector<HTMLButtonElement>('.rule-back')!); await loaded('movement-stat');
    expect(overlay.querySelector('.rule-back')).toBeNull();
    await close();
  });

  it('opens technique help above the school picker and restores the picker and keyboard focus on Escape', async () => {
    const { fixture, element, overlay, state, click, loaded } = await setup();
    const name = element.querySelector('#ninja-1-name');
    const band = state.band(); const revision = state.revision();
    await click(element.querySelector<HTMLButtonElement>('#ninja-1-technique-group')!);
    const trigger = overlay.querySelector<HTMLButtonElement>('app-rule-help [data-rule-id="jutsu-puerta-protectora"]')!;
    await click(trigger); await loaded('jutsu-puerta-protectora');
    expect(overlay.querySelectorAll('[role="dialog"]')).toHaveLength(2);
    expect(overlay.querySelector('[data-rule-section]')!.textContent).toContain('up to 5');
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    await fixture.whenStable();
    expect(overlay.querySelector('#rules-dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(overlay.querySelectorAll('.school-option')).toHaveLength(12);
    expect(element.querySelector('#ninja-1-name')).toBe(name);
    expect(state.band()).toBe(band); expect(state.revision()).toBe(revision);
    await click(overlay.querySelector<HTMLButtonElement>('[data-option-id="taijutsu"]')!);
    expect(state.band().ninjas[0].techniqueGroup.id).toBe('taijutsu');
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
  });

  it('keeps equipment selection separate from help, supports backdrop dismissal and restores the picker', async () => {
    const { fixture, element, overlay, state, click, loaded } = await setup();
    await click(element.querySelector<HTMLButtonElement>('#ninja-1-items-1')!);
    expect(overlay.querySelector('button button')).toBeNull();
    const trigger = overlay.querySelector<HTMLButtonElement>('[data-rule-id="smoke-bomb"]')!;
    await click(trigger); await loaded('smoke-bomb');
    expect(state.band().ninjas[0].equipment.items).toHaveLength(0);
    const backdrops = overlay.querySelectorAll<HTMLElement>('.cdk-overlay-backdrop');
    backdrops[backdrops.length - 1].click(); await fixture.whenStable();
    expect(overlay.querySelector('#rules-dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await click(overlay.querySelector<HTMLButtonElement>('[data-option-id="smokeBomb"]')!);
    expect(state.band().ninjas[0].equipment.items[0].id).toBe('smokeBomb');
  });

  it('switches the open rule, related titles and history between English and Spanish', async () => {
    const { element, overlay, state, i18n, fetchDocument, click, loaded } = await setup();
    const band = state.band(); const revision = state.revision();
    const nameInput = element.querySelector('#ninja-1-name');
    TestBed.inject(RuleDialogsService).open('team-creation'); await loaded('team-creation');
    expect(overlay.querySelector('.language-notice')).toBeNull();
    expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain('Team Creation');
    await vi.waitFor(() => expect(overlay.querySelector('[data-related-rule="ninja-types"]')).not.toBeNull());
    await click(overlay.querySelector<HTMLButtonElement>('[data-related-rule="ninja-types"]')!); await loaded('ninja-types');
    expect(overlay.querySelectorAll('table tbody tr')).toHaveLength(4);
    expect(overlay.querySelector('table')!.textContent).toContain('Jutsu Master');
    expect(fetchDocument.mock.calls.every(([url]) => url.includes('/rules/en/'))).toBe(true);
    await i18n.setLanguage('es');
    await vi.waitFor(() => expect(overlay.querySelector('.reference-label')!.textContent).toBe('Referencia rápida'));
    await vi.waitFor(() => expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain('Tipos de ninja'));
    expect(overlay.querySelector('article')!.getAttribute('lang')).toBe('es');
    expect(overlay.querySelector<HTMLButtonElement>('.rule-close')!.getAttribute('aria-label')).toBe('Cerrar');
    await click(overlay.querySelector<HTMLButtonElement>('.rule-back')!); await loaded('team-creation');
    expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain('Creación del equipo');
    await vi.waitFor(() => expect(overlay.querySelector('[data-related-rule="ninja-types"]')!.textContent).toContain('Tipos de ninja'));
    const requests = fetchDocument.mock.calls.length;
    await i18n.setLanguage('en');
    await vi.waitFor(() => expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain('Team Creation'));
    await vi.waitFor(() => expect(overlay.querySelector('[data-related-rule="ninja-types"]')!.textContent).toContain('Ninja Types'));
    expect(fetchDocument).toHaveBeenCalledTimes(requests);
    expect(state.band()).toBe(band); expect(state.revision()).toBe(revision);
    expect(element.querySelector('#ninja-1-name')).toBe(nameInput);
    await click(overlay.querySelector<HTMLButtonElement>('.rule-close')!);
  });

  it('reports a failed document load and retries without closing the dialog', async () => {
    const { element, overlay, fetchDocument, click, loaded } = await setup();
    fetchDocument.mockRejectedValueOnce(new Error('Offline'));
    await click(element.querySelector<HTMLButtonElement>('app-ninja-summary [data-rule-id="skill"]')!);
    await vi.waitFor(() => expect(overlay.querySelector('[role="alert"]')).not.toBeNull());
    await click(overlay.querySelector<HTMLButtonElement>('.rule-retry')!); await loaded('skill');
    expect(overlay.querySelector('[role="alert"]')).toBeNull();
    expect(overlay.querySelectorAll('#rules-dialog')).toHaveLength(1);
    await click(overlay.querySelector<HTMLButtonElement>('.rule-close')!);
  });

  it('ignores late rule responses when the reader has already navigated back', async () => {
    const { element, overlay, click, loaded } = await setup();
    await click(element.querySelector<HTMLButtonElement>('app-ninja-summary [data-rule-id="movement-stat"]')!); await loaded('movement-stat');
    await vi.waitFor(() => expect(overlay.querySelector('[data-related-rule="charge"]')).not.toBeNull());
    const service = TestBed.inject(RulesService);
    const original = service.load.bind(service);
    const charge = readRuleDocument(readFileSync(resolve('src/assets/rules/en/actions.md'), 'utf8')).get('charge')!;
    let finish!: (value: typeof charge) => void;
    const pending = new Promise<typeof charge>((resolve) => { finish = resolve; });
    vi.spyOn(service, 'load').mockImplementation((id, language) => id === 'charge' ? pending : original(id, language));
    await click(overlay.querySelector<HTMLButtonElement>('[data-related-rule="charge"]')!);
    expect(overlay.querySelector('[role="status"]')).not.toBeNull();
    await click(overlay.querySelector<HTMLButtonElement>('.rule-back')!); await loaded('movement-stat');
    finish(charge);
    await vi.waitFor(() => expect(overlay.querySelector('[data-rule-section="movement-stat"]')).not.toBeNull());
    expect(overlay.querySelector('[data-rule-section="charge"]')).toBeNull();
    await click(overlay.querySelector<HTMLButtonElement>('.rule-close')!);
  });

  it.each([
    ['en', 'es', 'Habilidad'], ['es', 'en', 'Skill'],
  ] as const)('ignores a late %s document after switching the open dialog to %s', async (initial, next, title) => {
    const { element, overlay, i18n, fetchDocument, click, loaded } = await setup(initial);
    let finish!: (document: string) => void;
    fetchDocument.mockImplementationOnce(() => new Promise<string>((resolve) => { finish = resolve; }));
    await click(element.querySelector<HTMLButtonElement>('app-ninja-summary [data-rule-id="skill"]')!);
    expect(overlay.querySelector('[role="status"]')).not.toBeNull();
    await i18n.setLanguage(next); await loaded('skill');
    expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain(title);
    finish(readFileSync(resolve(`src/assets/rules/${initial}/attributes.md`), 'utf8'));
    await vi.waitFor(() => expect(overlay.querySelector('article')!.getAttribute('lang')).toBe(next));
    expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain(title);
    expect(overlay.querySelectorAll('#rules-dialog')).toHaveLength(1);
    await click(overlay.querySelector<HTMLButtonElement>('.rule-close')!);
  });
});
