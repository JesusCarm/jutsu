import type { EquipmentDefinition } from './game-types';
export class EquipmentEntry {
  readonly name: string;
  readonly description: string;
  readonly cost: string;

  constructor(definition: EquipmentDefinition | null = null) {
    const cost = definition?.cost ?? '';
    if (definition !== null && (typeof definition.name !== 'string'
      || typeof definition.description !== 'string' || typeof cost !== 'string')) {
      throw new TypeError('Equipment must define its name, description and action cost text.');
    }
    this.name = definition?.name ?? '';
    this.description = definition?.description ?? '';
    this.cost = cost;
    Object.freeze(this);
  }
}
