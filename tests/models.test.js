import assert from 'node:assert/strict';
import { test } from 'vitest';
import { Band } from '../src/app/core/models/band';
import { Equipment } from '../src/app/core/models/equipment';
import { EquipmentEntry } from '../src/app/core/models/equipment-entry';
import { GameCatalog } from '../src/app/core/models/game-catalog';
import { Ninja } from '../src/app/core/models/ninja';
import { NinjaStats } from '../src/app/core/models/ninja-stats';
import { Technique } from '../src/app/core/models/technique';
import { TechniqueGroup } from '../src/app/core/models/technique-group';
import { createTestGameData } from './fixtures/game-data.js';
import { NINJA_TYPES } from '../src/app/core/models/ninja-options';

test('fixed equipment slots can be selected out of order and cleared without shifting other selections', () => {
  const equipment = new Equipment();
  const kunai = { id: 'kunai', parameters: {}, cost: { amount: 1, unit: 'action' } };
  const shuriken = { id: 'shuriken', parameters: {}, cost: { amount: 1, unit: 'action' } };
  equipment.selectSlot('weapons', 2, shuriken);
  assert.deepEqual(equipment.weapons.map((entry) => entry.id), ['', '', 'shuriken']);
  equipment.selectSlot('weapons', 0, kunai);
  equipment.selectSlot('weapons', 1, kunai);
  equipment.selectSlot('weapons', 0, null);
  assert.deepEqual(equipment.weapons.map((entry) => entry.id), ['', 'kunai', 'shuriken']);
  equipment.selectSlot('weapons', 2, null);
  assert.deepEqual(equipment.weapons.map((entry) => entry.id), ['', 'kunai']);
  equipment.selectSlot('weapons', 1, null);
  assert.equal(equipment.weapons.length, 0);
  equipment.selectSlot('items', 1, { id: 'smokeBomb', parameters: {}, cost: { amount: 1, unit: 'action' } });
  assert.equal(equipment.items[1].id, 'smokeBomb');
  assert.equal(equipment.weapons.length, 0);
  equipment.selectSlot('items', 1, null);
  assert.equal(equipment.items.length, 0);
});

test('fixed equipment slots reject invalid indices and definitions without altering the inventory', () => {
  const equipment = new Equipment();
  equipment.selectSlot('weapons', 0, { id: 'kunai', parameters: {}, cost: { amount: 1, unit: 'action' } });
  const before = JSON.stringify(equipment);
  for (const slot of [-1, 3, 0.5, NaN]) assert.throws(() => equipment.selectSlot('weapons', slot, null), RangeError);
  assert.throws(() => equipment.selectSlot('items', 2, null), RangeError);
  assert.throws(() => equipment.selectSlot('weapons', 0, undefined), TypeError);
  assert.throws(() => equipment.selectSlot('weapons', 0, { id: 'Broken' }), TypeError);
  assert.equal(JSON.stringify(equipment), before);
});

test('a band starts with exactly three independent ninjas and no selected definitions', () => {
  const band = new Band();
  assert.equal(band.ninjas.length, 3);
  for (const ninja of band.ninjas) {
    assert.ok(ninja instanceof Ninja);
    assert.ok(ninja.stats instanceof NinjaStats);
    assert.ok(ninja.equipment instanceof Equipment);
    assert.ok(ninja.techniqueGroup instanceof TechniqueGroup);
    assert.equal(ninja.type, '');
    assert.equal(ninja.techniqueGroup.id, '');
    assert.equal(ninja.techniqueGroup.techniques.length, 0);
    assert.ok(Object.values(ninja.stats).every((value) => value === null));
  }
});

test('selecting a ninja type defines all stats, preserves zero and prevents editing derived values', () => {
  const data = createTestGameData();
  const ninja = new Ninja();
  ninja.selectType(data.ninjaTypes[0]);
  assert.equal(ninja.type, 'physical');
  assert.deepEqual({ ...ninja.stats }, data.ninjaTypes[0].stats);
  assert.equal(ninja.stats.chakra, 0);
  assert.throws(() => { ninja.stats.chakra = 99; }, TypeError);
  assert.throws(() => { ninja.stats = new NinjaStats(); }, TypeError);
  assert.throws(() => { ninja.type = 'defensive'; }, TypeError);

  ninja.selectType(data.ninjaTypes[1]);
  assert.equal(ninja.type, 'defensive');
  assert.deepEqual({ ...ninja.stats }, data.ninjaTypes[1].stats);
  ninja.selectType(null);
  assert.equal(ninja.type, '');
  assert.ok(Object.values(ninja.stats).every((value) => value === null));
});

test('all known types can be selected before their stats are supplied, without inventing values', () => {
  const catalog = new GameCatalog();
  const ninja = new Ninja();
  for (const name of NINJA_TYPES) {
    ninja.selectType(catalog.getNinjaType(name));
    assert.equal(ninja.type, name);
    assert.ok(Object.values(ninja.stats).every((value) => value === null));
    assert.equal(JSON.parse(JSON.stringify(ninja)).type, name);
  }
  assert.equal(catalog.getNinjaType('Unknown'), undefined);
});

test('switching from a configured type to one with pending stats clears the previous numbers', () => {
  const data = createTestGameData();
  const catalog = new GameCatalog({ ninjaTypes: [data.ninjaTypes[0]] });
  const ninja = new Ninja();
  ninja.name = 'Preserved name';
  ninja.techniqueGroup.selectGroup(data.techniqueGroups[0]);
  ninja.selectType(catalog.getNinjaType('physical'));
  assert.equal(ninja.stats.chakra, 0);

  ninja.selectType(catalog.getNinjaType('defensive'));
  assert.equal(ninja.type, 'defensive');
  assert.ok(Object.values(ninja.stats).every((value) => value === null));
  assert.equal(ninja.name, 'Preserved name');
  assert.equal(ninja.techniqueGroup.id, 'taijutsu');

  ninja.selectType(catalog.getNinjaType('physical'));
  assert.deepEqual({ ...ninja.stats }, data.ninjaTypes[0].stats);
});

test('a selected group supplies exactly three immutable techniques and switching replaces them', () => {
  const data = createTestGameData();
  const group = new TechniqueGroup();
  group.selectGroup(data.techniqueGroups[0]);
  assert.equal(group.id, 'taijutsu');
  assert.equal(group.techniques.length, 3);
  assert.ok(group.techniques.every((technique) => technique instanceof Technique));
  assert.deepEqual(JSON.parse(JSON.stringify(group.techniques)), data.techniqueGroups[0].techniques);
  assert.throws(() => { group.id = 'medical'; }, TypeError);
  assert.throws(() => { group.techniques[0].id = 'Changed'; }, TypeError);
  assert.throws(() => { group.techniques[1].isMokushin = false; }, TypeError);
  assert.throws(() => group.techniques.pop(), TypeError);

  group.selectGroup(data.techniqueGroups[1]);
  assert.equal(group.id, 'medical');
  assert.deepEqual(JSON.parse(JSON.stringify(group.techniques)), data.techniqueGroups[1].techniques);
  group.selectGroup(null);
  assert.equal(group.id, '');
  assert.deepEqual(group.techniques, []);
});

test('incomplete definitions leave the previous selected type and technique group intact', () => {
  const data = createTestGameData();
  const ninja = new Ninja();
  ninja.selectType(data.ninjaTypes[0]);
  ninja.techniqueGroup.selectGroup(data.techniqueGroups[0]);

  assert.throws(() => ninja.selectType(undefined), TypeError);
  assert.throws(() => ninja.selectType({ id: 'defensive', stats: { chakra: 1 } }), TypeError);
  assert.throws(() => ninja.techniqueGroup.selectGroup({ id: 'medical', techniques: [] }), TypeError);
  const invalidGroup = structuredClone(data.techniqueGroups[1]);
  invalidGroup.techniques[2].chakra = null;
  assert.throws(() => ninja.techniqueGroup.selectGroup(invalidGroup), TypeError);
  assert.equal(ninja.type, 'physical');
  assert.equal(ninja.stats.chakra, 0);
  assert.equal(ninja.techniqueGroup.id, 'taijutsu');
  assert.equal(ninja.techniqueGroup.techniques.length, 3);
});

test('equipment enforces three weapons and two items, including attempts to bypass list methods', () => {
  const equipment = new Equipment();
  for (const [kind, limit] of [['weapons', 3], ['items', 2]]) {
    for (let index = 0; index < limit; index++) {
      assert.ok(equipment.canAddEntry(kind));
      assert.ok(equipment.addEntry(kind) instanceof EquipmentEntry);
    }
    assert.equal(equipment.getLimit(kind), limit);
    assert.equal(equipment.canAddEntry(kind), false);
    assert.throws(() => equipment.addEntry(kind), RangeError);
    assert.throws(() => equipment.getEntries(kind).push(new EquipmentEntry()), TypeError);
    assert.equal(equipment.getEntries(kind).length, limit);
    equipment.removeEntry(kind, 0);
    assert.ok(equipment.canAddEntry(kind));
    equipment.addEntry(kind);
    assert.equal(equipment.getEntries(kind).length, limit);
  }
});

test('equipment selection copies its definition and removal preserves other entries and lists', () => {
  const data = createTestGameData();
  const equipment = new Equipment();
  equipment.addEntry('weapons');
  equipment.addEntry('weapons');
  equipment.addEntry('items');
  const first = equipment.selectEntry('weapons', 0, data.weapons[0]);
  const second = equipment.selectEntry('weapons', 1, data.weapons[1]);
  const item = equipment.selectEntry('items', 0, data.items[0]);
  assert.notEqual(first, data.weapons[0]);
  assert.throws(() => { first.id = 'Edited'; }, TypeError);
  assert.throws(() => { first.parameters.value = 1; }, TypeError);
  assert.deepEqual(first.cost, data.weapons[0].cost);
  assert.throws(() => { first.cost = 'Edited'; }, TypeError);

  assert.equal(equipment.removeEntry('weapons', 0), first);
  assert.deepEqual(equipment.weapons, [second]);
  assert.deepEqual(equipment.items, [item]);
  const blank = equipment.selectEntry('weapons', 0, null);
  assert.equal(blank.id, '');
  assert.deepEqual(blank.parameters, {});
});

test('invalid equipment operations cannot remove or overwrite an existing entry', () => {
  const equipment = new Equipment();
  const entry = equipment.addEntry('weapons');
  for (const index of [-1, 1, 0.5, NaN]) {
    assert.throws(() => equipment.removeEntry('weapons', index), RangeError);
    assert.throws(() => equipment.selectEntry('weapons', index, null), RangeError);
  }
  assert.throws(() => equipment.addEntry('unknown'), TypeError);
  assert.throws(() => equipment.getEntries('addEntry'), TypeError);
  assert.throws(() => equipment.selectEntry('weapons', 0, { id: 'Incomplete' }), TypeError);
  assert.throws(() => equipment.selectEntry('weapons', 0, undefined), TypeError);
  assert.deepEqual(equipment.weapons, [entry]);
});

test('changing selections on one ninja does not change another ninja or the catalog', () => {
  const data = createTestGameData();
  const band = new Band();
  const [first, second] = band.ninjas;
  for (const ninja of [first, second]) {
    ninja.selectType(data.ninjaTypes[0]);
    ninja.techniqueGroup.selectGroup(data.techniqueGroups[0]);
    ninja.equipment.addEntry('weapons');
    ninja.equipment.selectEntry('weapons', 0, data.weapons[0]);
  }
  assert.notEqual(first.stats, second.stats);
  assert.notEqual(first.techniqueGroup.techniques[0], second.techniqueGroup.techniques[0]);
  first.selectType(data.ninjaTypes[1]);
  first.techniqueGroup.selectGroup(data.techniqueGroups[1]);
  first.equipment.removeEntry('weapons', 0);
  assert.equal(second.type, 'physical');
  assert.equal(second.techniqueGroup.id, 'taijutsu');
  assert.equal(second.equipment.weapons.length, 1);
  assert.equal(data.weapons.length, 4);
  assert.equal(band.ninjas[2].type, '');
});

test('catalog lookups and JSON serialization preserve selected definitions and data types', () => {
  const data = createTestGameData();
  const catalog = new GameCatalog(data);
  const ninja = new Ninja();
  ninja.name = 'Edited name';
  ninja.selectType(catalog.getNinjaType('physical'));
  ninja.techniqueGroup.selectGroup(catalog.getTechniqueGroup('taijutsu'));
  ninja.equipment.addEntry('items');
  ninja.equipment.selectEntry('items', 0, catalog.getEquipment('items')[0]);

  assert.deepEqual(JSON.parse(JSON.stringify(ninja)), {
    name: 'Edited name',
    type: 'physical',
    stats: data.ninjaTypes[0].stats,
    techniqueGroup: data.techniqueGroups[0],
    equipment: { weapons: [], items: [data.items[0]] },
  });
  assert.equal(catalog.getNinjaType('Unknown'), undefined);
  assert.throws(() => catalog.getEquipment('ninjaTypes'), TypeError);
});
