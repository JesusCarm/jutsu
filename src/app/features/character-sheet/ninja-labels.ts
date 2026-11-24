const TYPES: Readonly<Record<string, string>> = {
  Physical: 'Physical',
  Defensive: 'Defensive',
  Offensive: 'Offensive',
  'Jutsu Master': 'Jutsu Master',
};

const GROUPS: Readonly<Record<string, string>> = {
  Taijutsu: 'Taijutsu',
  Medical: 'Medical Techniques',
  Shadow: 'Shadow Techniques',
  'Soft Techniques': 'Gentle Techniques',
  'Soft Defense': 'Gentle Defense',
  'Illusion Techniques': 'Illusion Techniques',
  'Fire Techniques': 'Fire Techniques',
  'Weather Techniques': 'Atmospheric Techniques',
  'Earth Techniques': 'Earth Techniques',
  'Hidden Techniques': 'Hidden Techniques',
  'Animal Spirit': 'Animal Spirit',
  'Weapon Summoning': 'Weapon Summoning',
};

export class NinjaLabels {
  type(name: string): string {
    return TYPES[name] ?? name;
  }

  group(name: string): string {
    return GROUPS[name] ?? name;
  }
}