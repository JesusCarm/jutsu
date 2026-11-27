import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import english from '../../../../public/i18n/en.json';
import spanish from '../../../../public/i18n/es.json';
import { GameText } from '../../core/i18n/game-text';
import { TranslationDictionary } from '../../core/i18n/translation-dictionary';
import { GAME_DATA } from '../../core/services/game-data';
import { EQUIPMENT_LIMITS, type StatName } from '../../core/models/game-types';
import { readRuleDocument, type RuleSection } from './rule-document';
import { EQUIPMENT_RULES, TECHNIQUE_RULES, STAT_RULES, RULE_REFERENCES, ruleDocumentPath, type RuleId } from './rule-references';

const locales = [ ['en', english], ['es', spanish] ] as const;
const sectionText = (section: RuleSection) => section.blocks.flatMap((block) => block.kind === 'paragraph' ? [block.text] : []).join('\n');
const numbers = (text: string) => [...text.matchAll(/\d+/g)].map((match) => Number(match[0]));

for (const [language, dictionary] of locales) {
  const text = new GameText(new TranslationDictionary(english, dictionary));
  const read = (id: RuleId) => readRuleDocument(readFileSync(resolve('src/assets', ruleDocumentPath(id, language)), 'utf8')).get(RULE_REFERENCES[id].anchor)!;

  describe(`${language} reference matches the application catalog`, () => {
    it('uses the same names for every technique, equipment entry, school and attribute', () => {
      for (const group of GAME_DATA.techniqueGroups) {
        for (const entry of group.techniques) {
          const id = TECHNIQUE_RULES[entry.id]!;
          expect(read(id).title, entry.id).toBe(text.technique(entry).name);
          const source = readFileSync(resolve('src/assets', ruleDocumentPath(id, language)), 'utf8');
          expect(source.split('\n')[0], group.id).toBe(`## ${text.groupName(group.id)}`);
        }
      }
      for (const entry of [...GAME_DATA.weapons, ...GAME_DATA.items]) expect(read(EQUIPMENT_RULES[entry.id]!).title, entry.id).toBe(text.equipment(entry).name);
      for (const [stat, id] of Object.entries(STAT_RULES)) expect(read(id).title).toBe(dictionary.stats[stat as StatName]);
    });

    it('preserves all fixed, variable and maintenance Chakra costs', () => {
      for (const group of GAME_DATA.techniqueGroups) {
        for (const entry of group.techniques) {
          const source = sectionText(read(TECHNIQUE_RULES[entry.id]!));
          const cost = numbers(source.split('·')[0]);
          if (typeof entry.chakra === 'number') expect(cost, entry.id).toEqual([entry.chakra]);
          else if ('initial' in entry.chakra) {
            expect(cost, entry.id).toEqual([entry.chakra.initial, entry.chakra.upkeep]);
            expect(source.split('·')[0], entry.id).toMatch(/round|ronda/);
          } else if (cost.length === 2) expect(cost, entry.id).toEqual([entry.chakra.min, entry.chakra.max]);
          else {
            expect(cost, entry.id).toEqual([entry.chakra.min]);
            expect(Number(/(?:up to|máximo) (\d+)/.exec(source)?.[1]), entry.id).toBe(entry.chakra.max);
          }
        }
      }
    });

    it('retains the numeric effects, distances and dice from every technique and equipment definition', () => {
      const entries = [
        ...GAME_DATA.techniqueGroups.flatMap((group) => group.techniques.map((entry) => ({ entry, id: TECHNIQUE_RULES[entry.id]! }))),
        ...[...GAME_DATA.weapons, ...GAME_DATA.items].map((entry) => ({ entry, id: EQUIPMENT_RULES[entry.id]! })),
      ];
      const words: Record<string, string> = { one: '1', two: '2', three: '3', uno: '1', dos: '2', tres: '3' };
      for (const { entry, id } of entries) {
        const source = sectionText(read(id)).replace(/\b(one|two|three|uno|dos|tres)\b/gi, (word) => words[word.toLowerCase()]);
        for (const [parameter, value] of Object.entries(entry.parameters)) {
          if (parameter.toLowerCase().includes('dice')) {
            expect([...source.matchAll(/(\d+)D6/g)].map((match) => Number(match[1])), `${entry.id}.${parameter}`).toContain(value);
          } else expect(numbers(source), `${entry.id}.${parameter}`).toContain(value);
        }
      }
    });

    it('matches all ninja profiles, inventory limits and equipment action costs', () => {
      const table = read('ninja-types').blocks.find((block) => block.kind === 'table')!;
      const order: readonly StatName[] = ['attack', 'defense', 'movement', 'skill', 'chakra', 'health'];
      if (table.kind !== 'table') throw new Error('Missing ninja profile table');
      expect(table.rows).toEqual(GAME_DATA.ninjaTypes.map((type) => [text.typeName(type.id), ...order.map((stat) => String(type.stats![stat]))]));
      const creation = sectionText(read('team-creation'));
      expect(creation).toContain(String(EQUIPMENT_LIMITS.weapons));
      expect(creation).toContain(String(EQUIPMENT_LIMITS.items));
      for (const entry of [...GAME_DATA.weapons, ...GAME_DATA.items]) {
        const source = sectionText(read(EQUIPMENT_RULES[entry.id]!));
        expect(numbers(source.split('\n')[0]), entry.id).toEqual([entry.cost!.amount]);
      }
    });
  });
}
