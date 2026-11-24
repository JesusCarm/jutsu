import type { TechniqueGroupDefinition } from './game-types';
import { Technique } from './technique';
import { TECHNIQUE_GROUPS } from './ninja-options';

export class TechniqueGroup {
  #id = '';
  #techniques: readonly Technique[] = Object.freeze([]);

  get id() {
    return this.#id;
  }

  get techniques() {
    return this.#techniques;
  }

  selectGroup(definition: TechniqueGroupDefinition | null | undefined) {
    if (definition === null) {
      this.#id = '';
      this.#techniques = Object.freeze([]);
      return;
    }
    if (!definition || !TECHNIQUE_GROUPS.includes(definition.id)
      || !Array.isArray(definition.techniques) || definition.techniques.length !== 3) {
      throw new TypeError('A technique group must define exactly three techniques.');
    }

    const techniques = definition.techniques.map((technique) => new Technique(technique));
    this.#id = definition.id;
    this.#techniques = Object.freeze(techniques);
  }

  toJSON() {
    return { id: this.id, techniques: this.techniques };
  }
}
