import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { PlatformAssetsService } from '../../core/services/platform-assets.service';
import { UI_ICON_ASSETS } from './ui-icon-assets';

const ICONS = {
  ...UI_ICON_ASSETS,
  minus: ['M6 12h12'],
  plus: ['M6 12h12M12 6v12'],
  close: ['m6 6 12 12M18 6 6 18'],
  sun: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5'],
  moon: ['M20.5 13A8.5 8.5 0 0 1 11 3.5a8.5 8.5 0 1 0 9.5 9.5Z'],
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
