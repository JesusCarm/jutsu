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
    ['physical', [6, 5, 7, 4, 12, 10]],
    ['defensive', [4, 6, 5, 5, 15, 10]],
    ['offensive', [8, 3, 7, 4, 15, 10]],
    ['jutsuMaster', [5, 4, 5, 5, 20, 10]],
  ];
  assert.deepEqual(catalog.ninjaTypes.map((type) => type.id), NINJA_TYPES);

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
  assert.deepEqual(catalog.techniqueGroups.map((group) => group.id), TECHNIQUE_GROUPS);

  const selected = new TechniqueGroup();
  for (const name of TECHNIQUE_GROUPS) {
    const definition = catalog.getTechniqueGroup(name);
    selected.selectGroup(definition);
    assert.equal(selected.id, name);
    assert.equal(selected.techniques.length, 3);
    assert.deepEqual(JSON.parse(JSON.stringify(selected.techniques)), definition.techniques);
    assert.ok(selected.techniques.every((technique) => Object.isFrozen(technique)));
  }
});

test('variable chakra costs and Mokushin indicators retain their supplied meaning', () => {
  const catalog = new GameCatalog(GAME_DATA);
  const taijutsu = catalog.getTechniqueGroup('taijutsu').techniques;
  assert.deepEqual(taijutsu[0].chakra, {min: 1, max: 5});
  assert.equal(taijutsu[0].isMokushin, true);
  assert.deepEqual(taijutsu[1].chakra, {min: 1, max: 3});
  assert.equal(taijutsu[1].isMokushin, false);

  const soft = catalog.getTechniqueGroup('softTechniques').techniques;
  assert.deepEqual(soft.find((technique) => technique.id === 'whiteEye').chakra, {initial: 3, upkeep: 1, unit: 'round'});
  const shadow = catalog.getTechniqueGroup('shadow').techniques;
  assert.equal(shadow.find((technique) => technique.id === 'transport').isMokushin, true);
  const illusion = catalog.getTechniqueGroup('illusionTechniques').techniques;
  assert.equal(illusion.find((technique) => technique.id === 'redEye').isMokushin, false);
});

test('selected weapons and items retain their description and action cost, including when replaced', () => {
  const catalog = new GameCatalog(GAME_DATA);
  const equipment = new Equipment();
  assert.deepEqual(catalog.weapons.map((weapon) => weapon.id), ['kunai', 'shuriken', 'explosiveSeal']);
  assert.deepEqual(catalog.items.map((item) => item.id), ['smokeBomb', 'soldierPill', 'curryPill', 'cakePill']);

  for (const kind of ['weapons', 'items']) {
    equipment.addEntry(kind);
    for (const definition of catalog.getEquipment(kind)) {
      const selected = equipment.selectEntry(kind, 0, definition);
      assert.deepEqual(JSON.parse(JSON.stringify(selected)), definition);
      assert.throws(() => { selected.cost = 'Changed'; }, TypeError);
    }
    equipment.selectEntry(kind, 0, null);
    assert.equal(equipment.getEntries(kind)[0].cost, null);
  }
});
