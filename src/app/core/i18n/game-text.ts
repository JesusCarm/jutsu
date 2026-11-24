import type { BandSnapshot } from '../models/band-snapshot';
import type { ChakraCost, EquipmentDefinition, TechniqueDefinition } from '../models/game-types';
import rules from '../../../assets/data/rules.json';
import { Costs, Items, NinjaTypes, TechniqueGroups, Techniques, Weapons, type TranslationKey } from './i18n-keys';
import { TranslationDictionary } from './translation-dictionary';

export interface EquipmentText { readonly name: string; readonly description: string; readonly cost: string; }
export interface TechniqueText { readonly name: string; readonly description: string; readonly chakra: string; readonly isMokushin: boolean; }
export interface LocalizedBandSnapshot {
  readonly name: string;
  readonly ninjas: readonly {
    readonly name: string;
    readonly type: string;
    readonly stats: BandSnapshot['ninjas'][number]['stats'];
    readonly techniqueGroup: { readonly name: string; readonly techniques: readonly TechniqueText[] };
    readonly equipment: { readonly weapons: readonly EquipmentText[]; readonly items: readonly EquipmentText[] };
  }[];
}

function lookup<T>(values: Readonly<Record<string, T>>, id: string): T | undefined {
  return Object.hasOwn(values, id) ? values[id] : undefined;
}

/** Converts language-neutral game data into a frozen-language presentation or PDF input. */
export class GameText {
  constructor(private readonly dictionary: TranslationDictionary) {}

  typeName(id: string): string { return this.name(NinjaTypes, id); }
  groupName(id: string): string { return this.name(TechniqueGroups, id); }

  technique(definition: TechniqueDefinition): TechniqueText {
    const keys = lookup(Techniques, definition.id);
    return {
      name: keys ? this.dictionary.t(keys.name) : definition.id,
      description: keys ? this.dictionary.t(keys.description, this.parameters(definition)) : '',
      chakra: this.chakra(definition.chakra), isMokushin: definition.isMokushin,
    };
  }

  equipment(definition: EquipmentDefinition): EquipmentText {
    const keys = lookup(Weapons, definition.id) ?? lookup(Items, definition.id);
    return {
      name: keys ? this.dictionary.t(keys.name) : definition.id,
      description: keys ? this.dictionary.t(keys.description, this.parameters(definition)) : '',
      cost: definition.cost ? this.dictionary.t(definition.cost.amount === 1 ? Costs.actionOne : Costs.actionOther, { amount: definition.cost.amount }) : '',
    };
  }

  band(band: BandSnapshot): LocalizedBandSnapshot {
    return {
      name: band.name,
      ninjas: band.ninjas.map((ninja) => ({
        name: ninja.name, type: this.typeName(ninja.type), stats: { ...ninja.stats },
        techniqueGroup: { name: this.groupName(ninja.techniqueGroup.id), techniques: ninja.techniqueGroup.techniques.map((technique) => this.technique(technique)) },
        equipment: {
          weapons: ninja.equipment.weapons.map((entry) => this.equipment(entry)),
          items: ninja.equipment.items.map((entry) => this.equipment(entry)),
        },
      })),
    };
  }

  private chakra(cost: ChakraCost): string {
    if (typeof cost === 'number') return this.dictionary.t(Costs.number, { amount: cost });
    if ('min' in cost) return this.dictionary.t(Costs.range, { min: cost.min, max: cost.max });
    return this.dictionary.t(Costs.maintenance, { initial: cost.initial, upkeep: cost.upkeep, unit: this.dictionary.t(Costs.round) });
  }

  private parameters(definition: EquipmentDefinition | TechniqueDefinition) {
    return { ...rules, ...definition.parameters, smokeBomb: this.dictionary.t(Items.smokeBomb.name), kunai: this.dictionary.t(Weapons.kunai.name) };
  }

  private name(keys: Readonly<Record<string, TranslationKey>>, id: string): string {
    const key = lookup(keys, id);
    return key ? this.dictionary.t(key) : id;
  }
}
