import { EQUIPMENT_LIMITS } from '../../core/models/game-types';
import type { EquipmentDefinition, EquipmentKind } from '../../core/models/game-types';
import type { IconName } from '../../shared/ui-icon/ui-icon.component';
import type { GameText } from '../../core/i18n/game-text';

const ICONS: Readonly<Record<string, IconName>> = {
  kunai: 'kunai', shuriken: 'shuriken', explosiveSeal: 'seal', smokeBomb: 'smoke',
  soldierPill: 'pill', curryPill: 'healing', cakePill: 'potion',
};

export class EquipmentPresentation {
  icon(kind: EquipmentKind, id: string): IconName {
    return id ? ICONS[id] ?? (kind === 'weapons' ? 'weapons' : 'equipment') : 'minus';
  }

  slots(kind: EquipmentKind, entries: readonly EquipmentDefinition[], text: GameText) {
    return Array.from({ length: EQUIPMENT_LIMITS[kind] }, (_, index) => {
      const entry = entries[index];
      return {
        index, id: entry?.id ?? '', ...(entry ? text.equipment(entry) : { name: '', description: '', cost: '' }),
        icon: this.icon(kind, entry?.id ?? ''),
      };
    });
  }
}
