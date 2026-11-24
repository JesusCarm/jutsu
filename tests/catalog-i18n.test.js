import assert from 'node:assert/strict';
import { test } from 'vitest';
import english from '../public/i18n/en.json';
import spanish from '../public/i18n/es.json';
import original from './fixtures/pre-i18n-game-data.json';
import { GAME_DATA } from '../src/app/core/services/game-data';
import { GameText } from '../src/app/core/i18n/game-text';
import { TranslationDictionary } from '../src/app/core/i18n/translation-dictionary';
import { Band } from '../src/app/core/models/band';

test('the English presentation preserves every supplied rule, cost, stat, technique name and Mokushin flag', () => {
  const text = new GameText(new TranslationDictionary(english));
  GAME_DATA.ninjaTypes.forEach((type, index) => {
    assert.equal(text.typeName(type.id), original.ninjaTypes[index].name);
    assert.deepEqual(type.stats, original.ninjaTypes[index].stats);
  });
  GAME_DATA.techniqueGroups.forEach((group, index) => {
    group.techniques.forEach((technique, techniqueIndex) => {
      assert.deepEqual(text.technique(technique), original.techniqueGroups[index].techniques[techniqueIndex]);
    });
  });
  for (const kind of ['weapons', 'items']) {
    GAME_DATA[kind].forEach((entry, index) => assert.deepEqual(text.equipment(entry), original[kind][index]));
  }
});

test('translations do not contain numeric rules and every rule parameter is used', () => {
  for (const category of ['techniques', 'weapons', 'items']) {
    const definitions = category === 'techniques' ? GAME_DATA.techniqueGroups.flatMap((group) => group.techniques) : GAME_DATA[category];
    for (const definition of definitions) {
      const source = english[category][definition.id];
      assert.doesNotMatch(source.description, /\d/);
      for (const parameter of Object.keys(definition.parameters)) assert.ok(source.description.includes(`{${parameter}}`), definition.id);
      assert.equal('name' in definition, false);
      assert.equal('description' in definition, false);
    }
  }
});

test('the localized DTO keeps free-form names and mechanics, with per-key fallback and no unresolved interpolation', () => {
  const band = new Band();
  band.name = 'My Ravens';
  const ninja = band.ninjas[0];
  ninja.name = 'Renée';
  ninja.selectType(GAME_DATA.ninjaTypes[0]);
  ninja.techniqueGroup.selectGroup(GAME_DATA.techniqueGroups[0]);
  ninja.equipment.selectSlot('items', 0, GAME_DATA.items[0]);
  const snapshot = JSON.parse(JSON.stringify(band));
  const partialSpanish = {
    ninjaTypes: spanish.ninjaTypes,
    techniques: { protectiveGate: spanish.techniques.protectiveGate },
    items: { smokeBomb: { name: spanish.items.smokeBomb.name } },
  };
  const localized = new GameText(new TranslationDictionary(english, partialSpanish)).band(snapshot);
  assert.equal(localized.name, band.name);
  assert.equal(localized.ninjas[0].name, ninja.name);
  assert.equal(localized.ninjas[0].type, 'Físico');
  assert.deepEqual(localized.ninjas[0].stats, snapshot.ninjas[0].stats);
  assert.equal(localized.ninjas[0].techniqueGroup.techniques[0].name, spanish.techniques.protectiveGate.name);
  assert.equal(localized.ninjas[0].techniqueGroup.techniques[0].chakra, '1–5');
  assert.equal(localized.ninjas[0].techniqueGroup.techniques[0].isMokushin, true);
  assert.equal(localized.ninjas[0].techniqueGroup.techniques[1].name, 'Gate of Speed');
  assert.equal(localized.ninjas[0].equipment.items[0].name, spanish.items.smokeBomb.name);
  assert.equal(localized.ninjas[0].equipment.items[0].description, original.items[0].description);
  assert.doesNotMatch(JSON.stringify(localized), /\{\w+\}/);
  assert.deepEqual(JSON.parse(JSON.stringify(band)), snapshot);
});

test('references to other equipment in rules use the same dictionary', () => {
  const text = new GameText(new TranslationDictionary(english, spanish));
  const arsenal = GAME_DATA.techniqueGroups.at(-1).techniques.find((technique) => technique.id === 'arsenal');
  assert.ok(text.technique(arsenal).description.includes(spanish.items.smokeBomb.name));
});
