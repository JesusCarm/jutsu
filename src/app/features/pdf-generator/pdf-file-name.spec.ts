import { describe, expect, it } from 'vitest';
import { PdfFileName } from './pdf-file-name';

describe('PDF file names', () => {
  const names = new PdfFileName();

  it.each([
    ['  Los Cuervos  ', 'Los-Cuervos.pdf'],
    ['A\u0301guilas del fuego', 'Águilas-del-fuego.pdf'],
    ['Ninjas.PDF', 'Ninjas.pdf'],
    ['../Ninjas: sombra\\luz?*', 'Ninjas-sombra-luz.pdf'],
    ['CON', 'jutsu-CON.pdf'],
    ['', 'jutsu-squad.pdf'],
    [' .pdf ', 'jutsu-squad.pdf'],
  ])('turns %j into %j', (name, expected) => {
    expect(names.fromBandName(name)).toBe(expected);
  });

  it('limits long names without splitting Unicode characters', () => {
    expect(names.fromBandName('🥷'.repeat(120))).toBe(`${'🥷'.repeat(100)}.pdf`);
  });
});
