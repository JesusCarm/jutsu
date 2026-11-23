import { computed, Injectable, signal } from '@angular/core';
import { Band } from '../../core/models/band';
import { GameCatalog } from '../../core/models/game-catalog';
import type { BandSnapshot } from '../../core/models/band-snapshot';
import type { EquipmentKind } from '../../core/models/game-types';
import { GAME_DATA } from '../../core/services/game-data';

@Injectable({ providedIn: 'root' })
export class BandStateService {
  readonly catalog = new GameCatalog(GAME_DATA);
  private readonly model = new Band();
  private readonly state = signal({ data: this.snapshot(), revision: 0 });
  readonly band = computed(() => this.state().data);
  readonly revision = computed(() => this.state().revision);

  setBandName(name: string): void {
    this.model.name = name;
    this.publish();
  }

  setName(index: number, name: string): void {
    this.ninja(index).name = name;
    this.publish();
  }

  selectType(index: number, name: string): void {
    this.ninja(index).selectType(name === '' ? null : this.catalog.getNinjaType(name));
    this.publish();
  }

  selectGroup(index: number, name: string): void {
    this.ninja(index).techniqueGroup.selectGroup(name === '' ? null : this.catalog.getTechniqueGroup(name));
    this.publish();
  }

  addEquipment(index: number, kind: EquipmentKind): void {
    this.ninja(index).equipment.addEntry(kind);
    this.publish();
  }

  selectEquipment(index: number, kind: EquipmentKind, entry: number, name: string): void {
    const definition = name === '' ? null : this.catalog.getEquipment(kind).find((item) => item.name === name);
    this.ninja(index).equipment.selectEntry(kind, entry, definition);
    this.publish();
  }

  selectEquipmentSlot(index: number, kind: EquipmentKind, slot: number, name: string): void {
    const definition = name === '' ? null : this.catalog.getEquipment(kind).find((item) => item.name === name);
    this.ninja(index).equipment.selectSlot(kind, slot, definition);
    this.publish();
  }

  removeEquipment(index: number, kind: EquipmentKind, entry: number): void {
    this.ninja(index).equipment.removeEntry(kind, entry);
    this.publish();
  }

  private ninja(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.model.ninjas.length) {
      throw new RangeError('Ninja index is out of range.');
    }
    return this.model.ninjas[index];
  }

  private snapshot(): BandSnapshot {
    return JSON.parse(JSON.stringify(this.model)) as BandSnapshot;
  }

  private publish(): void {
    this.state.update((state) => ({ data: this.snapshot(), revision: state.revision + 1 }));
  }
}
