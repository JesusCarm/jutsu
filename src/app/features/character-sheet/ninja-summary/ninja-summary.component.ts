import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { NinjaSnapshot } from '../../../core/models/band-snapshot';
import { EquipmentSummaryComponent } from '../equipment-summary/equipment-summary.component';
import { StatsViewComponent } from '../stats-view/stats-view.component';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { NinjaTypePresentation } from '../ninja-type-presentation';

@Component({
  selector: 'app-ninja-summary',
  imports: [StatsViewComponent, EquipmentSummaryComponent, UiIconComponent],
  templateUrl: './ninja-summary.component.html',
  styleUrl: './ninja-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NinjaSummaryComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly text = inject(GameTextService);

  readonly ninja = input.required<NinjaSnapshot>();
  readonly index = input.required<number>();
  readonly active = input(false);
  readonly selected = output<void>();
  private readonly typePresentation = new NinjaTypePresentation();
  protected readonly typeIcon = computed(() => this.typePresentation.icon(this.ninja().type));

  protected select(): void {
    if (globalThis.matchMedia?.('(min-width: 56rem)').matches) return;
    this.selected.emit();
  }
}
