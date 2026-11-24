import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const english = await read('public/i18n/en.json');
const keys = [];
function keyTree(node, prefix = '') {
  return Object.fromEntries(Object.entries(node).map(([key, value]) => {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(key)) throw new Error(`Invalid translation key: ${key}`);
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' && value.trim()) {
      keys.push(path);
      return [key, path];
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Missing English text: ${path}`);
    return [key, keyTree(value, path)];
  }));
}
const tree = keyTree(english);
const header = '// Generated from public/i18n/en.json by npm run i18n:generate. Do not edit.\n';
const exports = Object.entries(tree).map(([key, value]) =>
  `export const ${key[0].toUpperCase() + key.slice(1)} = ${JSON.stringify(value, null, 2)} as const;\n`).join('\n');
const categories = Object.keys(tree).map((key) => key[0].toUpperCase() + key.slice(1));
const source = header + exports + `\ntype Leaves<T> = T extends string ? T : { [K in keyof T]: Leaves<T[K]> }[keyof T];\n`
  + `export type TranslationKey = Leaves<typeof ${categories.join(' | typeof ')}>;\n`
  + `export const ALL_TRANSLATION_KEYS: readonly TranslationKey[] = ${JSON.stringify(keys, null, 2)};\n`;
const catalogs = {
  ninjaTypes: await read('src/assets/data/ninja-types.json'),
  techniqueGroups: await read('src/assets/data/technique-groups.json'),
  ...await read('src/assets/data/equipment.json'),
};
catalogs.techniques = catalogs.techniqueGroups.flatMap((group) => group.techniques);
for (const [category, entries] of Object.entries(catalogs)) {
  const ids = new Set();
  for (const { id } of entries) {
    if (ids.has(id) || !Object.hasOwn(english[category], id)) throw new Error(`Invalid or untranslated ID: ${category}.${id}`);
    ids.add(id);
  }
  if (ids.size !== Object.keys(english[category]).length) throw new Error(`Dictionary/catalog mismatch: ${category}`);
}
// Additional locales may be partial. Validate keys and interpolation tokens when provided.
const { readdir } = await import('node:fs/promises');
function validateLocale(locale, reference, path = '') {
  for (const [key, value] of Object.entries(locale)) {
    const full = path ? `${path}.${key}` : key;
    if (!Object.hasOwn(reference, key)) throw new Error(`Unknown locale key: ${full}`);
    if (value === null) continue;
    if (typeof reference[key] === 'string') {
      if (typeof value !== 'string') throw new Error(`Invalid locale value: ${full}`);
      const tokens = (s) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort().join();
      if (value.trim() && tokens(value) !== tokens(reference[key])) throw new Error(`Interpolation mismatch: ${full}`);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) validateLocale(value, reference[key], full);
    else throw new Error(`Invalid locale category: ${full}`);
  }
}
for (const name of await readdir(new URL('public/i18n/', root))) {
  if (name.endsWith('.json')) validateLocale(await read(`public/i18n/${name}`), english);
}
const target = new URL('src/app/core/i18n/i18n-keys.ts', root);
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8').catch(() => '') !== source) throw new Error('Translation keys are out of date. Run npm run i18n:generate.');
} else {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(new URL('./', target), { recursive: true });
  await writeFile(target, source);
}
console.log(`Validated ${keys.length} translation keys (${fileURLToPath(target)}).`);
