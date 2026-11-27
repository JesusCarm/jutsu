import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAME_DATA } from '../../core/services/game-data';
import { readRuleDocument, isRuleImage } from './rule-document';
import { RULE_REFERENCES, STAT_RULES, TECHNIQUE_RULES, EQUIPMENT_RULES, ruleDocumentPath, isRuleId } from './rule-references';
import { LANGUAGES } from '../../core/i18n/languages';
import { ruleTextParts } from './rule-keywords';

describe('Quick-reference source documents', () => {
  it('resolves every reference, related rule and image in the real documents', () => {
    for (const { id: language } of LANGUAGES) {
    for (const [id, reference] of Object.entries(RULE_REFERENCES)) {
      if (!isRuleId(id)) throw new Error(`Unknown rule: ${id}`);
      const document = readRuleDocument(readFileSync(resolve('src/assets', ruleDocumentPath(id, language)), 'utf8'));
      const section = document.get(reference.anchor)!;
      expect(section, id).toBeDefined();
      expect(section.title, id).toBeTruthy();
      expect(section.blocks.length, id).toBeGreaterThan(0);
      const images = section.blocks.flatMap((block) => block.kind === 'image' ? [block.path] : []);
      if (section.icon) images.push(section.icon);
      for (const path of images) expect(existsSync(resolve('src', path)), path).toBe(true);
      for (const related of reference.related ?? []) expect(RULE_REFERENCES[related], related).toBeDefined();
    }
    }
  });

  it('covers all attributes, equipment and techniques without using translated names as catalog IDs', () => {
    expect(Object.keys(STAT_RULES)).toHaveLength(6);
    for (const entry of [...GAME_DATA.weapons, ...GAME_DATA.items]) expect(EQUIPMENT_RULES[entry.id], entry.id).toBeTruthy();
    for (const group of GAME_DATA.techniqueGroups) {
      for (const technique of group.techniques) expect(TECHNIQUE_RULES[technique.id], technique.id).toBeTruthy();
    }
  });

  it('extracts only the requested section and preserves its icon and table', () => {
    const sections = readRuleDocument(readFileSync(resolve('src/assets/rules/es/team-creation.md'), 'utf8'));
    const types = sections.get('ninja-types')!;
    expect(types.title).toBe('Tipos de ninja');
    const table = types.blocks.find((block) => block.kind === 'table')!;
    expect(table.kind).toBe('table');
    if (table.kind === 'table') {
      expect(table.headers).toEqual(['Tipo', 'AT', 'DE', 'MOV', 'HAB', 'CH', 'V']);
      expect(table.rows).toHaveLength(4);
      expect(table.rows[0]).toEqual(['Físico', '6', '5', '7', '4', '12', '10']);
    }
    const stats = readRuleDocument(readFileSync(resolve('src/assets/rules/es/attributes.md'), 'utf8'));
    expect(stats.get('chakra')!.icon).toBe('assets/icons/chakra_ico.svg');
  });

  it('keeps raw HTML as text and rejects external or traversing image URLs', () => {
    const section = readRuleDocument('<a id="test"></a>\n### Test\n\n<script>alert(1)</script>').get('test')!;
    expect(section.blocks).toEqual([{ kind: 'paragraph', text: '<script>alert(1)</script>' }]);
    for (const path of ['https://example.test/a.svg', 'assets/icons/../../a.svg', 'javascript:alert(1)', '//example.test/a.svg']) {
      expect(isRuleImage(path)).toBe(false);
      expect(() => readRuleDocument(`<a id="test"></a>\n### Test\n\n![Image](${path})`)).toThrow();
    }
  });
});

describe('Rule keywords', () => {
  it('links complete bilingual phrases and preserves punctuation, accents and whitespace', () => {
    const text = 'Acción/Mokushin (LDV, 8″): ataque a distancia. Sin Carga; Chakra.\nLoS / ER / DI.';
    const parts = ruleTextParts(text);
    expect(parts.map((part) => part.text).join('')).toBe(text);
    expect(parts.filter((part) => part.rule).map((part) => part.rule)).toEqual([
      'mokushin', 'line-of-sight', 'ranged', 'charge', 'chakra', 'line-of-sight', 'interaction-distance', 'interaction-distance',
    ]);
    expect(ruleTextParts('charcoal discarded chakraLess fallacy').some((part) => part.rule)).toBe(false);
  });

  it('preserves emphasis and avoids linking the current rule to itself', () => {
    const parts = ruleTextParts('**Chakra:** 3 · **Momento:** Mokushin.', 'chakra');
    expect(parts.find((part) => part.text === 'Chakra')).toMatchObject({ strong: true, rule: undefined });
    expect(parts.find((part) => part.text === 'Mokushin')).toMatchObject({ rule: 'mokushin' });
    expect(parts.map((part) => part.text).join('')).toBe('Chakra: 3 · Momento: Mokushin.');
  });

  it('links Burst and the older Dash alias to the same action', () => {
    expect(ruleTextParts('Burst / Dash / Impulso').filter((part) => part.rule).map((part) => part.rule)).toEqual(['impulse', 'impulse', 'impulse']);
  });
});
