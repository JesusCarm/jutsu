import { computed, inject, Injectable } from '@angular/core';
import type { EquipmentDefinition, TechniqueDefinition } from '../models/game-types';
import { GameText } from './game-text';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class GameTextService {
  private readonly i18n = inject(I18nService);
  private readonly text = computed(() => this.snapshot());

  snapshot(): GameText { return new GameText(this.i18n.snapshot()); }
  typeName(id: string): string { return this.text().typeName(id); }
  groupName(id: string): string { return this.text().groupName(id); }
  technique(definition: TechniqueDefinition) { return this.text().technique(definition); }
  equipment(definition: EquipmentDefinition) { return this.text().equipment(definition); }
}
