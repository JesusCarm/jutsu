import type { TechniqueDefinition } from './game-types';
export class Technique {
  readonly name: string;
  readonly description: string;
  readonly chakra: number | string;
  readonly isMokushin: boolean;

  constructor({ name, description, chakra, isMokushin }: TechniqueDefinition) {
    const validChakra = Number.isFinite(chakra)
      || (typeof chakra === 'string' && chakra.trim().length > 0);
    if (typeof name !== 'string' || typeof description !== 'string'
      || !validChakra || typeof isMokushin !== 'boolean') {
      throw new TypeError('A technique must define its name, description, chakra and Mokushin value.');
    }
    this.name = name;
    this.description = description;
    this.chakra = chakra;
    this.isMokushin = isMokushin;
    Object.freeze(this);
  }
}
