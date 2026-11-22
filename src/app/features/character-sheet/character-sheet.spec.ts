import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CharacterSheet } from './character-sheet';
import { BandState } from './band-state';
import { GENERATE_BAND_PDF } from '../pdf-generator/pdf-generation';

async function setup() {
  const generate = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
  TestBed.configureTestingModule({ imports: [CharacterSheet], providers: [{ provide: GENERATE_BAND_PDF, useValue: generate }] });
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
  return { fixture, element, state, select, click, generate };
}

describe('Character sheet migration', () => {
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

  it('generates the current form snapshot through the button and announces success', async () => {
    const { fixture, element, state, generate } = await setup();
    state.setName(2, 'Kaede');
    element.querySelector<HTMLButtonElement>('#generate-pdf')!.click();
    await fixture.whenStable();
    expect(generate).toHaveBeenCalledWith(state.band());
    expect(element.querySelector('#pdf-status')!.textContent).toBe('PDF generated successfully.');
    expect(element.querySelector<HTMLButtonElement>('#generate-pdf')!.disabled).toBe(false);
  });
});
