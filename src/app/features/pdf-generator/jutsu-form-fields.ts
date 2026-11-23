import type { PdfFormField, PdfFormIcon, ReadyTypography } from './pdf-types';

const BASE: ReadyTypography = {
  font: 'Eagle Lake', fallbackFonts: ['DejaVu Sans'], fontSize: 9, minFontSize: 6,
  fontSizeUnit: 'pt', lineHeight: null, alignment: 'left', verticalAlignment: 'top', color: '#000000',
};

export class JutsuFormFields {
  readonly fields: readonly PdfFormField[];
  readonly icons: readonly PdfFormIcon[];

  constructor() {
    const prefix = 'Ninja1_';
    const path = 'ninjas.0.';
    const field = (suffix: string, sources: string[], type: PdfFormField['type'],
      typography: Partial<ReadyTypography> = {}, multiline = false): PdfFormField => ({
      name: prefix + suffix, sources: sources.map((source) => path + source), type, multiline,
      typography: { ...BASE, ...typography },
    });
    this.fields = [
      field('name', ['name'], 'text', { fontSize: 14, minFontSize: 8, verticalAlignment: 'middle' }),
      field('technique_group', ['techniqueGroup.name'], 'text', { verticalAlignment: 'middle' }),
      ...Object.entries({ attack: 'attack', defense: 'defense', movement: 'movement', hability: 'skill', chakra: 'chakra', life: 'health' })
        .map(([suffix, stat]) => field(`stats_${suffix}`, [`stats.${stat}`], 'number', {
          fontSize: 11, minFontSize: 7, alignment: 'center', verticalAlignment: 'middle',
        })),
      ...Array.from({ length: 3 }, (_, technique) => [
        field(`technique_${technique + 1}`, [`techniqueGroup.techniques.${technique}`], 'technique', {}, true),
        field(`technique_${technique + 1}_cost`, [`techniqueGroup.techniques.${technique}.chakra`], 'text', {
          minFontSize: 4, alignment: 'center', verticalAlignment: 'middle',
        }),
      ]).flat(),
      field('items_and_weapons', ['equipment.weapons', 'equipment.items'], 'list', { verticalAlignment: 'middle' }),
    ];
    this.icons = Array.from({ length: 3 }, (_, technique) => ({
      name: `${prefix}technique_${technique + 1}_mokushin`,
      source: `${path}techniqueGroup.techniques.${technique}.isMokushin`, icon: 'mokushin',
    }));
  }
}
