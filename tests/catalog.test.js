import assert from 'node:assert/strict';
import { test } from 'vitest';
import { GAME_DATA } from '../src/app/core/services/game-data';
import { NINJA_STATS, NINJA_TYPES, TECHNIQUE_GROUPS } from '../src/app/core/models/ninja-options';
import { Equipment } from '../src/app/core/models/equipment';
import { GameCatalog } from '../src/app/core/models/game-catalog';
import { TechniqueGroup } from '../src/app/core/models/technique-group';
import { Ninja } from '../src/app/core/models/ninja';

test('all four ninja types load the supplied stats in the established field order', () => {
  const catalog = new GameCatalog(GAME_DATA);
  const ninja = new Ninja();
  assert.deepEqual(NINJA_STATS, ['attack', 'defense', 'movement', 'skill', 'chakra', 'health']);
  const supplied = [
    ['Physical', [6, 5, 7, 4, 12, 10]],
    ['Defensive', [4, 6, 5, 5, 12, 10]],
    ['Offensive', [8, 3, 7, 4, 15, 10]],
    ['Jutsu Master', [5, 4, 5, 5, 20, 10]],
  ];
  assert.deepEqual(catalog.ninjaTypes.map((type) => type.name), NINJA_TYPES);

  for (const [name, expected] of supplied) {
    const definition = catalog.getNinjaType(name);
    ninja.selectType(definition);
    assert.equal(ninja.type, name);
    assert.deepEqual(NINJA_STATS.map((stat) => ninja.stats[stat]), expected);
    assert.ok(Object.isFrozen(ninja.stats));
  }
});

test('all twelve supplied groups can be selected and define exactly three read-only techniques', () => {
  const catalog = new GameCatalog(GAME_DATA);
  assert.equal(catalog.techniqueGroups.length, 12);
  assert.deepEqual(catalog.techniqueGroups.map((group) => group.name), TECHNIQUE_GROUPS);

  const selected = new TechniqueGroup();
  for (const name of TECHNIQUE_GROUPS) {
    const definition = catalog.getTechniqueGroup(name);
    selected.selectGroup(definition);
    assert.equal(selected.name, name);
    assert.equal(selected.techniques.length, 3);
    assert.deepEqual(JSON.parse(JSON.stringify(selected.techniques)), definition.techniques);
    assert.ok(selected.techniques.every((technique) => Object.isFrozen(technique)));
  }
});

test('variable chakra costs and Mokushin indicators retain their supplied meaning', () => {
  const catalog = new GameCatalog(GAME_DATA);
  const taijutsu = catalog.getTechniqueGroup('Taijutsu').techniques;
  assert.equal(taijutsu[0].chakra, '1–5');
  assert.equal(taijutsu[0].isMokushin, true);
  assert.equal(taijutsu[1].chakra, '1–3');
  assert.equal(taijutsu[1].isMokushin, false);

  const soft = catalog.getTechniqueGroup('Soft Techniques').techniques;
  assert.equal(soft.find((technique) => technique.name === 'White Eye').chakra, '3 + 1/round');
  const shadow = catalog.getTechniqueGroup('Shadow').techniques;
  assert.equal(shadow.find((technique) => technique.name === 'Transport').isMokushin, true);
  const illusion = catalog.getTechniqueGroup('Illusion Techniques').techniques;
  assert.equal(illusion.find((technique) => technique.name === 'Red Eye').isMokushin, false);
});

test('selected weapons and items retain their description and action cost, including when replaced', () => {
  const catalog = new GameCatalog(GAME_DATA);
  const equipment = new Equipment();
  assert.deepEqual(catalog.weapons.map((weapon) => weapon.name), ['Kunai', 'Shuriken', 'Explosive Seal']);
  assert.deepEqual(catalog.items.map((item) => item.name), ['Smoke Bomb', 'Soldier Pill', 'Curry Pill', 'Cake Pill']);

  for (const kind of ['weapons', 'items']) {
    equipment.addEntry(kind);
    for (const definition of catalog.getEquipment(kind)) {
      const selected = equipment.selectEntry(kind, 0, definition);
      assert.deepEqual(JSON.parse(JSON.stringify(selected)), definition);
      assert.throws(() => { selected.cost = 'Changed'; }, TypeError);
    }
    equipment.selectEntry(kind, 0, null);
    assert.equal(equipment.getEntries(kind)[0].cost, '');
  }
});
