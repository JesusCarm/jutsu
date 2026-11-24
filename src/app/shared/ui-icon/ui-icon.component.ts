import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { PlatformAssetsService } from '../../core/services/platform-assets.service';

const ICONS = {
  flagEn: 'flag-en.svg',
  flagEs: 'flag-es.svg',
  chakra: 'chakra_ico.svg',
  attack: 'ataque_ico.svg',
  defense: 'defensa_ico.svg',
  movement: 'movimiento_ico.svg',
  skill: 'habilidad_ico.svg',
  weapons: 'armas_ico.svg',
  equipment: 'equipo_ico.svg',
  mokushin: 'mokushin_ico.svg',
  target: 'objetivo_ico.svg',
  health: 'vida_ico.svg',
  kunai: 'kunai.svg',
  shuriken: 'shuriken.svg',
  seal: 'sello_explosivo.svg',
  smoke: 'bomba_humo.svg',
  pill: 'pildora_soldado.svg',
  healing: 'pildora_curry.svg',
  potion: 'pildora_pastel.svg',
  book: 'escuela_jutsu.svg',
  physical: 'fisico.svg',
  defensive: 'defensivo.svg',
  offensive: 'ofensivo.svg',
  jutsuMaster: 'jutsu_master.svg',
  minus: ['M6 12h12'],
  file: ['M14 2H5v20h14V7l-5-5ZM14 2v6h5M12 11v7M9 15l3 3 3-3'],
  download: ['M12 3v12M7 10l5 5 5-5M4 16v5h16v-5'],
  printer: ['M6 9V3h12v6M6 17H3v-8h18v8h-3M6 14h12v8H6v-8ZM17 11h1'],
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-ui-icon',
  templateUrl: './ui-icon.component.html',
  styleUrl: './ui-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconComponent {
  readonly name = input<IconName>('minus');
  protected readonly colored = computed(() => this.name() === 'flagEn' || this.name() === 'flagEs');
  private readonly assets = inject(PlatformAssetsService);
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
