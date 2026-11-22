export type EquipmentKind = 'weapons' | 'items';
export const EQUIPMENT_LIMITS: Readonly<Record<EquipmentKind, number>> = Object.freeze({ weapons: 3, items: 2 });
export type StatName = 'attack' | 'defense' | 'movement' | 'skill' | 'chakra' | 'health';
export type StatValues = Record<StatName, number>;
export interface NinjaTypeDefinition { name: string; stats: StatValues | null; }
export interface EquipmentDefinition { name: string; description: string; cost?: string; }
export interface TechniqueDefinition { name: string; description: string; chakra: number | string; isMokushin: boolean; }
export interface TechniqueGroupDefinition { name: string; techniques: TechniqueDefinition[]; }
export interface GameData {
  ninjaTypes: NinjaTypeDefinition[];
  techniqueGroups: TechniqueGroupDefinition[];
  weapons: EquipmentDefinition[];
  items: EquipmentDefinition[];
}
