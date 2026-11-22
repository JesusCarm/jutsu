import type { EquipmentKind, EquipmentDefinition } from './game-types';
import { EquipmentEntry } from './equipment-entry';

export class Equipment {
  #entries: Record<EquipmentKind, readonly EquipmentEntry[]> = { weapons: Object.freeze([]), items: Object.freeze([]) };

  get weapons() {
    return this.#entries.weapons;
  }

  get items() {
    return this.#entries.items;
  }

  getEntries(kind: EquipmentKind) {
    if (kind !== 'weapons' && kind !== 'items') {
      throw new TypeError(`Unknown equipment list: ${kind}`);
    }
    return this.#entries[kind];
  }

  getLimit(kind: EquipmentKind) {
    this.getEntries(kind);
    return kind === 'weapons' ? 3 : 2;
  }

  canAddEntry(kind: EquipmentKind) {
    return this.getEntries(kind).length < this.getLimit(kind);
  }

  addEntry(kind: EquipmentKind) {
    if (!this.canAddEntry(kind)) {
      throw new RangeError(`A ninja can have at most ${this.getLimit(kind)} ${kind}.`);
    }
    const entry = new EquipmentEntry();
    this.#entries[kind] = Object.freeze([...this.getEntries(kind), entry]);
    return entry;
  }

  selectEntry(kind: EquipmentKind, index: number, definition: EquipmentDefinition | null | undefined) {
    this.validateIndex(kind, index);
    if (definition === undefined) throw new TypeError('Choose an equipment definition or clear the selection.');
    const entry = new EquipmentEntry(definition);
    this.#entries[kind] = Object.freeze(this.getEntries(kind).map((current, currentIndex) => {
      return currentIndex === index ? entry : current;
    }));
    return entry;
  }

  validateIndex(kind: EquipmentKind, index: number) {
    const entries = this.getEntries(kind);
    if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
      throw new RangeError('Equipment entry index is out of range.');
    }
  }

  removeEntry(kind: EquipmentKind, index: number) {
    this.validateIndex(kind, index);
    const entries = this.getEntries(kind);
    const removed = entries[index];
    this.#entries[kind] = Object.freeze(entries.filter((entry, currentIndex) => currentIndex !== index));
    return removed;
  }

  toJSON() {
    return { weapons: this.weapons, items: this.items };
  }
}
