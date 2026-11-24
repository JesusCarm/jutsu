import type { NinjaTypeDefinition } from './game-types';
import { Equipment } from './equipment';
import { NinjaStats } from './ninja-stats';
import { TechniqueGroup } from './technique-group';
import { NINJA_TYPES } from './ninja-options';

export class Ninja {
  #type = '';
  #stats = new NinjaStats();

  name: string;
  readonly techniqueGroup: TechniqueGroup;
  readonly equipment: Equipment;

  constructor() {
    this.name = '';
    this.techniqueGroup = new TechniqueGroup();
    this.equipment = new Equipment();
  }

  get type() {
    return this.#type;
  }

  get stats() {
    return this.#stats;
  }

  selectType(definition: NinjaTypeDefinition | null | undefined) {
    if (definition === null) {
      this.#type = '';
      this.#stats = new NinjaStats();
      return;
    }
    if (!definition || !NINJA_TYPES.includes(definition.id)) {
      throw new TypeError('Choose a known ninja type.');
    }

    const stats = new NinjaStats(definition.stats ?? null);
    this.#type = definition.id;
    this.#stats = stats;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      stats: this.stats,
      techniqueGroup: this.techniqueGroup,
      equipment: this.equipment,
    };
  }
}
