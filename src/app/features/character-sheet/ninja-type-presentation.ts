import type { IconName } from '../../shared/ui-icon/ui-icon.component';

const ICONS: Readonly<Record<string, IconName>> = {
  physical: 'physical',
  defensive: 'defensive',
  offensive: 'offensive',
  jutsuMaster: 'jutsuMaster',
};

export class NinjaTypePresentation {
  icon(type: string): IconName | null {
    return Object.hasOwn(ICONS, type) ? ICONS[type] : null;
  }
}
