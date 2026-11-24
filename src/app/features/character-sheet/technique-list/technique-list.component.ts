import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Labels, Stats } from '../../../core/i18n/i18n-keys';
import { GameTextService } from '../../../core/i18n/game-text.service';
import type { TechniqueDefinition } from '../../../core/models/game-types';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';

@Component({
  selector: 'app-technique-list', imports: [UiIconComponent],
  templateUrl: './technique-list.component.html', styleUrl: './technique-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechniqueListComponent {
  readonly definitions = input.required<readonly TechniqueDefinition[]>();
  protected readonly i18n = inject(I18nService);
  protected readonly Labels = Labels;
  protected readonly Stats = Stats;
  private readonly text = inject(GameTextService);
  protected readonly techniques = computed(() => this.definitions().map((definition) => this.text.technique(definition)));
}
