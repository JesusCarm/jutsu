const TYPES: Readonly<Record<string, string>> = {
  Physical: 'Físico', Defensive: 'Defensivo', Offensive: 'Ofensivo', 'Jutsu Master': 'Maestro jutsu',
};
const GROUPS: Readonly<Record<string, string>> = {
  Taijutsu: 'Taijutsu', Medical: 'Técnicas médicas', Shadow: 'Técnicas de sombra',
  'Soft Techniques': 'Técnicas suaves', 'Soft Defense': 'Defensa suave', 'Illusion Techniques': 'Técnicas de ilusión',
  'Fire Techniques': 'Técnicas ígneas', 'Weather Techniques': 'Técnicas del clima', 'Earth Techniques': 'Técnicas de tierra',
  'Hidden Techniques': 'Técnicas ocultas', 'Animal Spirit': 'Espíritu animal', 'Weapon Summoning': 'Invocación de armas',
};

export class NinjaLabels {
  type(name: string): string { return TYPES[name] ?? name; }
  group(name: string): string { return GROUPS[name] ?? name; }
}
