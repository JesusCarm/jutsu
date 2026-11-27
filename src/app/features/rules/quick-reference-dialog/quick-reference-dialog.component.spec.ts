import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { describe, expect, it, vi } from 'vitest';
import { provideTestI18n } from '../../../../../tests/fixtures/i18n-testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Language } from '../../../core/i18n/languages';
import { CharacterSheetComponent } from '../../character-sheet/character-sheet.component';
import { BandStateService } from '../../character-sheet/band-state.service';
import { GENERATE_BAND_PDF, PdfGenerationService } from '../../pdf-generator/pdf-generation.service';
import { RULE_DOCUMENT_FETCH } from '../rules.service';
import { RULE_REFERENCES } from '../rule-references';
import { RULE_CHAPTERS } from '../rule-chapters';
import { RuleDialogsService } from '../rule-dialogs.service';

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
  const trigger = element.querySelector<HTMLButtonElement>('.editor-toolbar [data-rule-id="overview"]')!;
  const click = async (button: HTMLButtonElement) => { button.focus(); button.click(); await fixture.whenStable(); };
  const loaded = async () => {
    await vi.waitFor(() => expect(overlay.querySelectorAll('#quick-reference-dialog [data-quick-rule]')).toHaveLength(Object.keys(RULE_REFERENCES).length));
    await fixture.whenStable();
  };
  const loadedRule = async (id: string) => {
    await vi.waitFor(() => expect(overlay.querySelector(`#rules-dialog [data-rule-section="${id}"]`)).not.toBeNull());
    await fixture.whenStable();
  };
  return { fixture, element, overlay, state, i18n, fetchDocument, trigger, click, loaded, loadedRule };
}

describe('Complete quick reference', () => {
  it.each(['en', 'es'] as const)('opens every chapter and rule from the header in %s', async (language) => {
    const { overlay, fetchDocument, trigger, click, loaded } = await setup(language);
    expect(fetchDocument).not.toHaveBeenCalled();
    await click(trigger); await loaded();
    const overview = overlay.querySelector('#quick-reference-dialog')!;
    expect(overview.getAttribute('aria-labelledby')).toBe('quick-reference-title');
    expect(overview.getAttribute('aria-modal')).toBe('true');
    expect(overview.querySelectorAll('.quick-reference-chapter')).toHaveLength(RULE_CHAPTERS.length);
    expect(overview.querySelectorAll('[data-rule-section]')).toHaveLength(Object.keys(RULE_REFERENCES).length);
    expect(overview.querySelectorAll('[data-quick-rule="jutsu-cuatro-garras"]')).toHaveLength(1);
    expect(overview.querySelector('table tbody')!.children).toHaveLength(4);
    expect(overview.querySelectorAll('.rule-diagram')).toHaveLength(10);
    expect([...overview.querySelectorAll('article')].every((article) => article.lang === language)).toBe(true);
    expect(fetchDocument).toHaveBeenCalledTimes(new Set(Object.values(RULE_REFERENCES).map((reference) => reference.file)).size);
    TestBed.inject(RuleDialogsService).openOverview();
    expect(overlay.querySelectorAll('#quick-reference-dialog')).toHaveLength(1);
    await click(overview.querySelector<HTMLButtonElement>('.quick-reference-close')!);
    expect(document.activeElement).toBe(trigger);
  });

  it('opens child dialogs and returns to the same reading position, keeping the squad and PDF', async () => {
    const { fixture, overlay, state, trigger, click, loaded, loadedRule, fetchDocument } = await setup();
    const pdf = TestBed.inject(PdfGenerationService);
    await pdf.generate();
    const band = state.band(); const revision = state.revision();
    await click(trigger); await loaded();
    const overview = overlay.querySelector('#quick-reference-dialog')!;
    const content = overview.querySelector<HTMLElement>('.quick-reference-content')!;
    const ruleTrigger = overview.querySelector<HTMLButtonElement>('[data-quick-rule="charge"]')!;
    content.scrollTop = 350;
    const requests = fetchDocument.mock.calls.length;
    for (const dismiss of ['close', 'escape', 'backdrop']) {
      await click(ruleTrigger); await loadedRule('charge');
      expect(overlay.querySelectorAll('[role="dialog"]')).toHaveLength(2);
      expect(overlay.querySelector('#quick-reference-dialog')).toBe(overview);
      if (dismiss === 'close') await click(overlay.querySelector<HTMLButtonElement>('#rules-dialog .rule-close')!);
      else if (dismiss === 'escape') document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
      else {
        const backdrops = overlay.querySelectorAll<HTMLElement>('.cdk-overlay-backdrop');
        backdrops[backdrops.length - 1].click();
      }
      await fixture.whenStable();
      expect(overlay.querySelector('#rules-dialog')).toBeNull();
      expect(overlay.querySelector('#quick-reference-dialog')).toBe(overview);
      expect(content.scrollTop).toBe(350);
      expect(document.activeElement).toBe(ruleTrigger);
      expect(state.band()).toBe(band); expect(state.revision()).toBe(revision); expect(pdf.hasPdf()).toBe(true);
    }
    expect(fetchDocument).toHaveBeenCalledTimes(requests);
    await click(overview.querySelector<HTMLButtonElement>('.quick-reference-close')!);
    expect(document.activeElement).toBe(trigger);
  });

  it('opens keyword links over the overview and retains normal navigation inside the child dialog', async () => {
    const { overlay, trigger, click, loaded, loadedRule } = await setup();
    await click(trigger); await loaded();
    const overview = overlay.querySelector('#quick-reference-dialog')!;
    const keyword = overview.querySelector<HTMLButtonElement>('[data-rule-section="jutsu-puerta-protectora"] [data-rule-id="mokushin"]')!;
    expect(keyword.getAttribute('aria-haspopup')).toBe('dialog');
    await click(keyword); await loadedRule('mokushin');
    await click(overlay.querySelector<HTMLButtonElement>('#rules-dialog [data-rule-id="jutsu"]')!); await loadedRule('jutsu');
    expect(overlay.querySelectorAll('[role="dialog"]')).toHaveLength(2);
    await click(overlay.querySelector<HTMLButtonElement>('#rules-dialog .rule-back')!); await loadedRule('mokushin');
    await click(overlay.querySelector<HTMLButtonElement>('#rules-dialog .rule-close')!);
    expect(document.activeElement).toBe(keyword);
    expect(overview.querySelectorAll('[data-quick-rule]')).toHaveLength(72);
    await click(overview.querySelector<HTMLButtonElement>('.quick-reference-close')!);
  });

  it('moves to a chapter through the contents index without opening another dialog', async () => {
    const { overlay, trigger, click, loaded } = await setup();
    await click(trigger); await loaded();
    const index = overlay.querySelector<HTMLButtonElement>('[data-chapter-target]')!;
    const heading = overlay.querySelector<HTMLElement>(`#${index.dataset['chapterTarget']}`)!;
    heading.scrollIntoView = vi.fn();
    await click(index);
    expect(document.activeElement).toBe(heading);
    expect(heading.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(overlay.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    await click(overlay.querySelector<HTMLButtonElement>('.quick-reference-close')!);
  });

  it('updates both dialog layers when language changes and retains the original rule button', async () => {
    const { fixture, overlay, i18n, trigger, click, loaded, loadedRule } = await setup();
    await click(trigger); await loaded();
    const overview = overlay.querySelector('#quick-reference-dialog')!;
    const ruleTrigger = overview.querySelector<HTMLButtonElement>('[data-quick-rule="impulse"]')!;
    await click(ruleTrigger); await loadedRule('impulse');
    expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain('Burst');
    await i18n.setLanguage('es');
    await vi.waitFor(() => expect(ruleTrigger.textContent).toContain('Impulso'));
    await vi.waitFor(() => expect(overlay.querySelector('#rule-dialog-title')!.textContent).toContain('Impulso'));
    expect(overview.querySelector('#quick-reference-title')!.textContent).toContain('Referencia rápida');
    expect(overview.querySelectorAll('[data-quick-rule]')).toHaveLength(72);
    expect(overview.querySelector('[data-quick-rule="impulse"]')).toBe(ruleTrigger);
    await click(overlay.querySelector<HTMLButtonElement>('#rules-dialog .rule-close')!);
    await fixture.whenStable();
    expect(document.activeElement).toBe(ruleTrigger);
    await click(overview.querySelector<HTMLButtonElement>('.quick-reference-close')!);
  });

  it('retries a failed overview document without fetching successful documents again', async () => {
    const { overlay, fetchDocument, trigger, click, loaded } = await setup();
    fetchDocument.mockRejectedValueOnce(new Error('Offline'));
    await click(trigger);
    await vi.waitFor(() => expect(overlay.querySelector('#quick-reference-dialog [role="alert"]')).not.toBeNull());
    const requests = fetchDocument.mock.calls.length;
    await click(overlay.querySelector<HTMLButtonElement>('.quick-reference-retry')!); await loaded();
    expect(fetchDocument).toHaveBeenCalledTimes(requests + 1);
    expect(overlay.querySelector('[role="alert"]')).toBeNull();
    await click(overlay.querySelector<HTMLButtonElement>('.quick-reference-close')!);
  });

  it('ignores the previous language when its overview finishes loading late', async () => {
    const { overlay, i18n, fetchDocument, trigger, click, loaded } = await setup();
    let finish!: (document: string) => void;
    fetchDocument.mockImplementationOnce(() => new Promise<string>((resolve) => { finish = resolve; }));
    await click(trigger);
    expect(overlay.querySelector('[role="status"]')).not.toBeNull();
    await i18n.setLanguage('es'); await loaded();
    finish(readFileSync(resolve('src/assets/rules/en/attributes.md'), 'utf8'));
    await vi.waitFor(() => expect(overlay.querySelector('[data-quick-rule="skill"]')!.textContent).toContain('Habilidad'));
    expect([...overlay.querySelectorAll('article')].every((article) => article.lang === 'es')).toBe(true);
    await click(overlay.querySelector<HTMLButtonElement>('.quick-reference-close')!);
  });
});
