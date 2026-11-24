import { describe, expect, it } from 'vitest';
import { PdfFileName } from './pdf-file-name';

describe('PDF file names', () => {
  const names = new PdfFileName();

  it.each([
    ['  The Ravens  ', 'jutsu-squad-The-Ravens.pdf'],
    ['Cafe\u0301 Ninjas', 'jutsu-squad-Café-Ninjas.pdf'],
    ['Ninjas.PDF', 'jutsu-squad-Ninjas.pdf'],
    ['../Ninjas: shadow\\light?*', 'jutsu-squad-Ninjas-shadow-light.pdf'],
    ['CON', 'jutsu-squad-CON.pdf'],
    ['', 'jutsu-squad.pdf'],
    [' .pdf ', 'jutsu-squad.pdf'],
  ])('turns %j into %j', (name, expected) => {
    expect(names.fromBandName(name)).toBe(expected);
  });

  it('limits long names without splitting Unicode characters', () => {
    expect(names.fromBandName('🥷'.repeat(120))).toBe(`jutsu-squad-${'🥷'.repeat(100)}.pdf`);
  });
});
