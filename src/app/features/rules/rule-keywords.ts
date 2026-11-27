import keywords from '../../../assets/rules/keywords.json';
import { isRuleId, type RuleId } from './rule-references';

export interface RuleTextPart { readonly text: string; readonly rule?: RuleId; readonly strong?: boolean; }
const terms = new Map<string, RuleId>();
for (const [id, aliases] of Object.entries(keywords)) {
  if (!isRuleId(id)) throw new Error(`Unknown keyword rule: ${id}`);
  for (const alias of aliases) terms.set(alias.toLowerCase(), id);
}
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = [...terms.keys()].sort((a, b) => b.length - a.length).map(escape).join('|');

/** Match complete terms, preferring phrases over their shorter constituent words. */
export function ruleTextParts(text: string, exclude?: RuleId): readonly RuleTextPart[] {
  const result: RuleTextPart[] = [];
  const emphasis = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  for (const fragment of emphasis) {
    const strong = fragment.startsWith('**') && fragment.endsWith('**');
    const value = strong ? fragment.slice(2, -2) : fragment;
    const regex = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${pattern})(?![\\p{L}\\p{N}_])`, 'giu');
    let offset = 0;
    for (const match of value.matchAll(regex)) {
      if (match.index > offset) result.push({ text: value.slice(offset, match.index), strong });
      const rule = terms.get(match[0].toLowerCase());
      result.push({ text: match[0], rule: rule === exclude ? undefined : rule, strong });
      offset = match.index + match[0].length;
    }
    if (offset < value.length) result.push({ text: value.slice(offset), strong });
  }
  return result;
}
