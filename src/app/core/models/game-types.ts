export type EquipmentKind = 'weapons' | 'items';
export const EQUIPMENT_LIMITS: Readonly<Record<EquipmentKind, number>> = Object.freeze({ weapons: 3, items: 2 });
export type StatName = 'attack' | 'defense' | 'movement' | 'skill' | 'chakra' | 'health';
export type StatValues = Record<StatName, number>;
export type RuleParameters = Readonly<Record<string, number | undefined>>;
export type ChakraCost = number | { readonly min: number; readonly max: number }
  | { readonly initial: number; readonly upkeep: number; readonly unit: string };
export interface ActionCost { readonly amount: number; readonly unit: string; }
export interface NinjaTypeDefinition { id: string; stats: StatValues | null; }
export interface EquipmentDefinition { readonly id: string; readonly parameters: RuleParameters; readonly cost: ActionCost | null; }
export interface TechniqueDefinition { readonly id: string; readonly parameters: RuleParameters; readonly chakra: ChakraCost; readonly isMokushin: boolean; }
export interface TechniqueGroupDefinition { id: string; techniques: TechniqueDefinition[]; }
export interface GameData {
  ninjaTypes: NinjaTypeDefinition[];
  techniqueGroups: TechniqueGroupDefinition[];
  weapons: EquipmentDefinition[];
  items: EquipmentDefinition[];
}
