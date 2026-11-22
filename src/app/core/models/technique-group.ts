import type { TechniqueGroupDefinition } from './game-types';
import { Technique } from './technique';
import { TECHNIQUE_GROUPS } from './ninja-options';

export class TechniqueGroup {
  #name = '';
  #techniques: readonly Technique[] = Object.freeze([]);

  get name() {
    return this.#name;
  }

  get techniques() {
    return this.#techniques;
  }

  selectGroup(definition: TechniqueGroupDefinition | null | undefined) {
    if (definition === null) {
      this.#name = '';
      this.#techniques = Object.freeze([]);
      return;
    }
    if (!definition || !TECHNIQUE_GROUPS.includes(definition.name)
      || !Array.isArray(definition.techniques) || definition.techniques.length !== 3) {
      throw new TypeError('A technique group must define exactly three techniques.');
    }

    const techniques = definition.techniques.map((technique) => new Technique(technique));
    this.#name = definition.name;
    this.#techniques = Object.freeze(techniques);
  }

  toJSON() {
    return { name: this.name, techniques: this.techniques };
  }
}
