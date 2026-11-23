import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { PlatformAssets } from '../core/services/platform-assets';

const ICONS = {
  chakra: 'chakra_ico.svg',
  attack: 'ataque_ico.svg',
  defense: 'defensa_ico.svg',
  movement: 'movimiento_ico.svg',
  skill: 'habilidad_ico.svg',
  weapons: 'armas_ico.svg',
  equipment: 'equipo_ico.svg',
  mokushin: 'mokushin.png',
  target: 'objetivo_ico.svg',
  health: 'vida_ico.svg',
  kunai: ['m15 3 6 6-9 8-5-5 8-9ZM8 15l-4 4M5 17l2 2M3 20a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z'],
  shuriken: ['m12 2 2 7 7-3-4 6 5 4-8-1-2 7-2-7-8 1 5-4-4-6 7 3 2-7Z', 'M11 11h2v2h-2Z'],
  seal: ['M5 4h14v16H5V4ZM9 8l6 8M15 8l-6 8M9 12h6'],
  smoke: ['M7 18a5 5 0 0 1 0-10 6 6 0 0 1 11 2 4 4 0 0 1 0 8H7Z'],
  pill: ['m8 4 12 12M4 8 8 4a5.66 5.66 0 0 1 8 0l4 4a5.66 5.66 0 0 1 0 8l-4 4a5.66 5.66 0 0 1-8 0l-4-4a5.66 5.66 0 0 1 0-8Z'],
  healing: ['M4 7h16v14H4V7ZM8 7V3h8v4M12 10v8M8 14h8'],
  potion: ['M9 3h6M10 3v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M8 15h8'],
  book: ['M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1ZM12 5v15'],
  minus: ['M6 12h12'],
  file: ['M14 2H5v20h14V7l-5-5ZM14 2v6h5M12 11v7M9 15l3 3 3-3'],
  download: ['M12 3v12M7 10l5 5 5-5M4 16v5h16v-5'],
  printer: ['M6 9V3h12v6M6 17H3v-8h18v8h-3M6 14h12v8H6v-8ZM17 11h1'],
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-ui-icon',
  template: `
    @if (imageUrl(); as url) {
      <img [src]="url" alt="" width="20" height="20" aria-hidden="true" draggable="false" />
    } @else {
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        @for (path of paths(); track $index) { <path [attr.d]="path" /> }
      </svg>
    }
  `,
  styles: `
    :host { display: inline-flex; width: 20px; height: 20px; flex: 0 0 auto; vertical-align: middle; }
    svg, img { display: block; width: 100%; height: 100%; }
    img { object-fit: contain; }
    img[src$='.svg'] { filter: invert(1); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIcon {
  readonly name = input<IconName>('minus');
  private readonly assets = inject(PlatformAssets);
  private readonly icon = computed(() => ICONS[this.name()]);
  protected readonly imageUrl = computed(() => {
    const icon = this.icon();
    return typeof icon === 'string' ? new URL(`icons/${icon}`, this.assets.baseUrl).href : null;
  });
  protected readonly paths = computed(() => {
    const icon = this.icon();
    return typeof icon === 'string' ? [] : icon;
  });
}
