import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const { version } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const commit = process.env.APP_COMMIT || 'local';
if (!/^(?:local|[a-f0-9]{40})$/.test(commit)) throw new Error('APP_COMMIT must be a full Git commit SHA or local.');
await writeFile(new URL('dist/jutsu/browser/build-info.json', root), JSON.stringify({ version, commit }) + '\n');
