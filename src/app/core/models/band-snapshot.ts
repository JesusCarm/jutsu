import type { EquipmentDefinition, StatName, TechniqueDefinition } from './game-types';

export interface NinjaSnapshot {
  readonly name: string;
  readonly type: string;
  readonly stats: Readonly<Record<StatName, number | null>>;
  readonly techniqueGroup: { readonly name: string; readonly techniques: readonly TechniqueDefinition[] };
  readonly equipment: { readonly weapons: readonly EquipmentDefinition[]; readonly items: readonly EquipmentDefinition[] };
}
export interface BandSnapshot { readonly ninjas: readonly NinjaSnapshot[]; }
