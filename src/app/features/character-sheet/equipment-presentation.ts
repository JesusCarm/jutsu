import { EQUIPMENT_LIMITS } from '../../core/models/game-types';
import type { EquipmentDefinition, EquipmentKind } from '../../core/models/game-types';
import type { IconName } from '../../shared/ui-icon';

const ICONS: Readonly<Record<string, IconName>> = {
  Kunai: 'kunai', Shuriken: 'shuriken', 'Explosive Seal': 'seal', 'Smoke Bomb': 'smoke',
  'Soldier Pill': 'pill', 'Curry Pill': 'healing', 'Cake Pill': 'potion',
};

export class EquipmentPresentation {
  slots(kind: EquipmentKind, entries: readonly EquipmentDefinition[]) {
    return Array.from({ length: EQUIPMENT_LIMITS[kind] }, (_, index) => {
      const entry = entries[index];
      return {
        index, name: entry?.name ?? '', description: entry?.description ?? '', cost: entry?.cost ?? '',
        icon: entry?.name ? ICONS[entry.name] ?? (kind === 'weapons' ? 'weapons' : 'equipment') : 'minus',
      };
    });
  }
}
