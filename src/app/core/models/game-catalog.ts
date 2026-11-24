import type { GameData, EquipmentKind, NinjaTypeDefinition, TechniqueGroupDefinition, EquipmentDefinition } from './game-types';
import { NINJA_TYPES } from './ninja-options';

export class GameCatalog {
  readonly ninjaTypes: NinjaTypeDefinition[];
  readonly techniqueGroups: TechniqueGroupDefinition[];
  readonly weapons: EquipmentDefinition[];
  readonly items: EquipmentDefinition[];

  constructor({ ninjaTypes = [], techniqueGroups = [], weapons = [], items = [] }: Partial<GameData> = {}) {
    this.ninjaTypes = ninjaTypes;
    this.techniqueGroups = techniqueGroups;
    this.weapons = weapons;
    this.items = items;
  }

  getNinjaType(name: string) {
    const definition = this.ninjaTypes.find((entry) => entry.id === name);
    if (definition) return definition;
    return NINJA_TYPES.includes(name) ? { id: name, stats: null } : undefined;
  }

  getTechniqueGroup(name: string) {
    return this.techniqueGroups.find((definition) => definition.id === name);
  }

  getEquipment(kind: EquipmentKind) {
    if (kind !== 'weapons' && kind !== 'items') {
      throw new TypeError(`Unknown equipment list: ${kind}`);
    }
    return this[kind];
  }
}
