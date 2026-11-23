import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PlatformAssets } from '../core/services/platform-assets';
import { UiIcon } from './ui-icon';

describe('UI icons', () => {
  it('loads a supplied SVG beneath the application base path as a decorative image', async () => {
    TestBed.configureTestingModule({ providers: [
      { provide: PlatformAssets, useValue: { baseUrl: 'https://example.test/jutsu/assets/' } },
    ] });
    const fixture = TestBed.createComponent(UiIcon);
    fixture.componentRef.setInput('name', 'attack');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const icon = element.querySelector('img')!;
    expect(icon.src).toBe('https://example.test/jutsu/assets/icons/ataque_ico.svg');
    expect(icon.alt).toBe('');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('svg')).toBeNull();
  });

  it('switches between supplied image files and inline icons when the input changes', async () => {
    const fixture = TestBed.createComponent(UiIcon);
    const element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('name', 'kunai');
    await fixture.whenStable();
    expect(element.querySelector('svg path')).not.toBeNull();
    expect(element.querySelector('img')).toBeNull();
    fixture.componentRef.setInput('name', 'equipment');
    await fixture.whenStable();
    expect(element.querySelector('img')!.src).toContain('/assets/icons/equipo_ico.svg');
    expect(element.querySelector('svg')).toBeNull();
    fixture.componentRef.setInput('name', 'minus');
    await fixture.whenStable();
    expect(element.querySelector('svg path')).not.toBeNull();
    expect(element.querySelector('img')).toBeNull();
  });
});
