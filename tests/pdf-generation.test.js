import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
import { Band } from '../src/app/core/models/band';
import { GameCatalog } from '../src/app/core/models/game-catalog';
import { GAME_DATA } from '../src/app/core/services/game-data';
import { BandFieldResolver } from '../src/app/features/pdf-generator/band-field-resolver';
import { BandPdfGenerator } from '../src/app/features/pdf-generator/band-pdf-generator';
import { JutsuPdfTemplate } from '../src/app/features/pdf-generator/jutsu-pdf-template';
import { PdfDocument } from '../src/app/features/pdf-generator/pdf-document';
import { PdfFieldFormatter } from '../src/app/features/pdf-generator/pdf-field-formatter';
import { PdfFontProvider } from '../src/app/features/pdf-generator/pdf-font-provider';
import { PdfTextLayout } from '../src/app/features/pdf-generator/pdf-text-layout';
import { fetchCoordinateTemplate } from './fixtures/coordinate-template';

const template = new JutsuPdfTemplate(pathToFileURL(resolve(process.cwd(), 'src/assets') + '/'));
const coordinateTemplate = { ...template, formFields: undefined, repeatedSheet: undefined };
const catalog = new GameCatalog(GAME_DATA);

async function fetchLocal(url) {
  try { return new Response(await readFile(new URL(url))); }
  catch { return new Response('Missing', { status: 404 }); }
}

function createBand(groupOffset = 0) {
  const band = new Band();
  band.ninjas.forEach((ninja, index) => {
    ninja.name = ['Renée', 'Kaede', 'Master Ñ'][index];
    ninja.selectType(catalog.ninjaTypes[index]);
    ninja.techniqueGroup.selectGroup(catalog.techniqueGroups[groupOffset + index]);
    ninja.equipment.addEntry('weapons');
    ninja.equipment.selectEntry('weapons', 0, catalog.weapons[0]);
    ninja.equipment.addEntry('items');
    ninja.equipment.selectEntry('items', 0, catalog.items[index]);
  });
  return band;
}

test('field resolution preserves zero and false, treats unselected array entries as empty and rejects unknown paths', () => {
  const resolver = new BandFieldResolver();
  const data = { ninjas: [{ stats: { chakra: 0 }, techniques: [], mokushin: false }] };
  assert.equal(resolver.resolve(data, 'ninjas.0.stats.chakra'), 0);
  assert.equal(resolver.resolve(data, 'ninjas.0.mokushin'), false);
  assert.equal(resolver.resolve(data, 'ninjas.0.techniques.0.name'), null);
  assert.throws(() => resolver.resolve(data, 'ninjas.0.unknown'), /Unknown band data path/);
  assert.throws(() => resolver.resolve(data, 'constructor.name'), /Unknown band data path/);
});

test('formatting preserves variable costs and symbols, and converts lists and boolean indicators explicitly', () => {
  const formatter = new PdfFieldFormatter();
  assert.equal(formatter.format(0, 'number'), '0');
  assert.equal(formatter.format(null, 'number'), '');
  assert.equal(formatter.format('3 + 1/round → ≥', 'text'), '3 + 1/round → ≥');
  assert.equal(formatter.format(true, 'boolean'), 'Mokushin');
  assert.equal(formatter.format(false, 'boolean'), '');
  assert.equal(formatter.format([{ name: 'Kunai' }, { name: '' }, { name: 'Smoke Bomb' }], 'list'), 'Kunai, Smoke Bomb');
  assert.throws(() => formatter.format({}, 'text'), TypeError);
  assert.throws(() => formatter.format('0', 'number'), TypeError);
});

test('Eagle Lake is embedded once and fallback fonts are used only for missing symbols', async () => {
  const pdf = await PdfDocument.fromBytes(new Uint8Array(await readFile(new URL(template.pdfUrl))));
  const requests = [];
  const fonts = new PdfFontProvider(pdf, template.fontUrls, async (url) => {
    requests.push(url);
    return fetchLocal(url);
  });
  const style = { font: 'Eagle Lake', fallbackFonts: ['DejaVu Sans'] };
  const [family, sameFamily] = await Promise.all([fonts.getFamily(style), fonts.getFamily(style)]);
  assert.equal(family, sameFamily);
  assert.equal(requests.length, 2);
  const runs = family.getRuns('Á→≥ñ');
  assert.equal(runs[0].record.raw.fullName, 'Eagle Lake');
  assert.equal(runs[1].record.raw.fullName, 'DejaVu Sans');
  assert.equal(runs.at(-1).record.raw.fullName, 'Eagle Lake');
  assert.equal(runs.map((run) => run.text).join(''), 'Á→≥ñ');
  assert.throws(() => family.getRuns('\u{10FFFF}'), /do not support/);
});

test('text layout fits all lines inside their box and reports overflow instead of truncating', async () => {
  const pdf = await PdfDocument.fromBytes(new Uint8Array(await readFile(new URL(template.pdfUrl))));
  const family = await new PdfFontProvider(pdf, template.fontUrls, fetchLocal)
    .getFamily({ font: 'Eagle Lake', fallbackFonts: ['DejaVu Sans'] });
  const box = { x: 10, y: 20, width: 120, height: 65 };
  const result = new PdfTextLayout().fit('Movement → 4 inches. Renée can move again.', family, box, {
    fontSize: 9, minFontSize: 6, alignment: 'center', verticalAlignment: 'middle', lineHeight: null,
  });
  for (const line of result.lines) {
    const metrics = family.getTextMetrics(line.text, result.fontSize);
    assert.ok(line.x + metrics.left >= box.x - 1e-6);
    assert.ok(line.x + metrics.left + metrics.width <= box.x + box.width + 1e-6);
    assert.ok(line.y + metrics.ascent <= box.y + box.height + 1e-6);
    assert.ok(line.y - metrics.descent >= box.y - 1e-6);
  }
  assert.throws(() => new PdfTextLayout().fit('Cannot fit', family, { x: 0, y: 0, width: 1, height: 1 }, {
    fontSize: 9, minFontSize: 9, alignment: 'left',
  }), /does not fit/);
});

test('all twelve groups generate a complete document with Unicode and leave the band and PDF source unchanged', async () => {
  const original = await readFile(new URL(template.pdfUrl));
  for (let offset = 0; offset < catalog.techniqueGroups.length; offset += 3) {
    const band = createBand(offset);
    const before = JSON.stringify(band);
    const bytes = await new BandPdfGenerator({ fetchResource: fetchLocal }).generate(band, template);
    assert.ok(bytes instanceof Uint8Array);
    assert.notDeepEqual(bytes, new Uint8Array(original));
    const pdf = await PdfDocument.fromBytes(new Uint8Array(bytes));
    assert.deepEqual(pdf.getPagesInfo(), [{ index: 0, width: 595.28, height: 841.89 }]);
    assert.equal(JSON.stringify(band), before);
  }
  assert.deepEqual(await readFile(new URL(template.pdfUrl)), original);
});

test('generation uses a snapshot taken before loading resources and combines inventory only once per ninja', async () => {
  const band = createBand();
  band.ninjas[0].name = 'Before';
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const requests = [];
  const generator = new BandPdfGenerator({ fetchResource: async (url) => {
    requests.push(url);
    if (url === template.configUrl) await gate;
    return fetchCoordinateTemplate(url, template.pdfUrl);
  } });
  const rendered = [];
  generator.renderer = { render(page, text) { rendered.push(text); } };
  const pending = generator.generate(band, coordinateTemplate);
  band.ninjas[0].name = 'After';
  release();
  await pending;
  assert.ok(rendered.includes('Before'));
  assert.ok(!rendered.includes('After'));
  assert.equal(rendered.filter((text) => text === 'Kunai, Smoke Bomb').length, 1);
  assert.equal(rendered.length, 54);
  for (const url of Object.values(template.fontUrls)) assert.equal(requests.filter((value) => value === url).length, 1);
});

test('unselected data produces empty fields and incomplete configuration stops before loading the PDF', async () => {
  const bytes = await new BandPdfGenerator({ fetchResource: fetchLocal }).generate(new Band(), template);
  assert.equal((await PdfDocument.fromBytes(new Uint8Array(bytes))).getPageCount(), 1);
  const definition = JSON.parse(await readFile(new URL(template.configUrl), 'utf8'));
  definition.typography.font = null;
  const requests = [];
  const generator = new BandPdfGenerator({ fetchResource: async (url) => {
    requests.push(url);
    return new Response(JSON.stringify(definition));
  } });
  await assert.rejects(() => generator.generate(createBand(), coordinateTemplate), /Complete the Affinity/);
  assert.deepEqual(requests, [template.configUrl]);
});
