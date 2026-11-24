import { describe, expect, it } from 'vitest';
import { PdfFileName } from './pdf-file-name';

describe('PDF file names', () => {
  const names = new PdfFileName();

  it.each([
    ['  Los Cuervos  ', 'jutsu-squad-Los-Cuervos.pdf'],
    ['A\u0301guilas del fuego', 'jutsu-squad-Águilas-del-fuego.pdf'],
    ['Ninjas.PDF', 'jutsu-squad-Ninjas.pdf'],
    ['../Ninjas: sombra\\luz?*', 'jutsu-squad-Ninjas-sombra-luz.pdf'],
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
