import { localizeBand } from './fixtures/localized-band.js';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
import { GAME_DATA } from '../src/app/core/services/game-data';
import { NINJA_STATS } from '../src/app/core/models/ninja-options';
import { Band } from '../src/app/core/models/band';
import { GameCatalog } from '../src/app/core/models/game-catalog';
import { AffinityCoordinateConverter } from '../src/app/features/pdf-generator/affinity-coordinate-converter';
import { PdfDocument } from '../src/app/features/pdf-generator/pdf-document';
import { PdfTemplateConfig } from '../src/app/features/pdf-generator/pdf-template-config';
import { PdfTemplateConfigLoader } from '../src/app/features/pdf-generator/pdf-template-config-loader';

const configUrl = pathToFileURL(resolve(process.cwd(), 'src/assets/pdf/fichas_rellenables_coordenadas.json'));
const realPdfUrl = pathToFileURL(resolve(process.cwd(), 'src/assets/pdf/fichas_rellenables.pdf'));
const reference = { width: 1000, height: 2000, unit: 'px', origin: 'top-left' };

function createDefinition() {
  return {
    id: 'test-template',
    pdf: '../fichas_rellenables.pdf',
    pages: [{ index: 0, reference: { ...reference } }],
    typography: {
      font: 'Helvetica', fontSize: 10, fontSizeUnit: 'pt',
      lineHeight: null, alignment: 'left', color: '#000000',
    },
    fields: [{
      id: 'ninjas.0.name', page: 0, type: 'text',
      box: { x: 100, y: 200, width: 300, height: 400 },
    }],
  };
}

test('pixel coordinates use the document ratio and invert Y for both points and complete boxes', () => {
  const converter = new AffinityCoordinateConverter(reference, { width: 500, height: 1000 });
  assert.deepEqual(converter.toPdfPoint({ x: 0, y: 0 }), { x: 0, y: 1000 });
  assert.deepEqual(converter.toPdfPoint({ x: 1000, y: 2000 }), { x: 500, y: 0 });
  assert.deepEqual(converter.toPdfBox({ x: 100, y: 200, width: 300, height: 400 }), {
    x: 50, y: 700, width: 150, height: 200,
  });
  assert.equal(converter.toPdfLength(20), 10);
});

test('horizontal and vertical scales are computed independently and PDF page origins are respected', () => {
  const converter = new AffinityCoordinateConverter(reference, { x: 10, y: -20, width: 600, height: 1000 });
  assert.deepEqual(converter.toPdfBox({ x: 0, y: 0, width: 1000, height: 2000 }), {
    x: 10, y: -20, width: 600, height: 1000,
  });
  assert.deepEqual(converter.toPdfPoint({ x: 100, y: 400 }), { x: 70, y: 780 });
  assert.equal(converter.toPdfLength(20, 'x'), 12);
  assert.equal(converter.toPdfLength(20, 'y'), 10);
});

test('point references also scale to the actual PDF dimensions instead of assuming equal dimensions', () => {
  const converter = new AffinityCoordinateConverter(
    { width: 595.3, height: 841.9, unit: 'pt', origin: 'top-left' },
    { width: 595.44, height: 841.92 },
  );
  const box = converter.toPdfBox({ x: 0, y: 0, width: 595.3, height: 841.9 });
  assert.ok(Math.abs(box.width - 595.44) < 1e-9);
  assert.ok(Math.abs(box.height - 841.92) < 1e-9);
  assert.ok(Math.abs(box.y) < 1e-9);
  assert.notEqual(converter.toPdfLength(100, 'x'), 100);
});

test('unknown dimensions, unsupported units and invalid or out-of-page coordinates cannot be converted', () => {
  for (const width of [null, undefined, 0, -1, NaN]) {
    assert.throws(() => new AffinityCoordinateConverter({ ...reference, width }, { width: 500, height: 1000 }), TypeError);
  }
  assert.throws(() => new AffinityCoordinateConverter({ ...reference, unit: 'mm' }, { width: 500, height: 1000 }), TypeError);
  assert.throws(() => new AffinityCoordinateConverter({ ...reference, origin: 'bottom-left' }, { width: 500, height: 1000 }), TypeError);
  const converter = new AffinityCoordinateConverter(reference, { width: 500, height: 1000 });
  assert.throws(() => converter.toPdfPoint({ x: -1, y: 0 }), TypeError);
  assert.throws(() => converter.toPdfPoint({ x: null, y: 0 }), TypeError);
  assert.throws(() => converter.toPdfPoint({ x: 1001, y: 0 }), RangeError);
  assert.throws(() => converter.toPdfBox({ x: 950, y: 0, width: 100, height: 20 }), RangeError);
  assert.throws(() => converter.toPdfBox({ x: 0, y: 0, width: 0, height: 20 }), TypeError);
  assert.throws(() => converter.toPdfLength(1, 'z'), TypeError);
});

test('the active JSON preserves supplied coordinates and explicitly excludes fields without a box', async () => {
  const config = new PdfTemplateConfig(JSON.parse(await readFile(configUrl, 'utf8')), configUrl);
  assert.equal(config.id, 'jutsu-fichas-rellenables');
  assert.equal(config.resolvePdfUrl(), realPdfUrl.href);
  assert.deepEqual(config.getPageReference(0), { width: 595.44, height: 841.92, unit: 'pt', origin: 'top-left' });
  assert.deepEqual(config.getPendingPages(), []);
  assert.equal(config.fields.length, 69);
  assert.equal(config.getActiveFields().length, 54);
  assert.equal(config.getPendingFields().length, 0);
  assert.equal(config.isReady(), true);
  assert.doesNotThrow(() => config.assertReady());
  assert.equal(config.typography.font, 'Eagle Lake');
  assert.equal(config.getField('ninjas.0.type').enabled, false);
  assert.deepEqual(config.getField('ninjas.0.equipment.items').sources, [
    'ninjas.0.equipment.weapons', 'ninjas.0.equipment.items',
  ]);
  for (let index = 0; index < 3; index++) {
    const prefix = `ninjas.${index}.stats.`;
    assert.deepEqual(config.fields.filter((field) => field.id.startsWith(prefix))
      .sort((left, right) => left.box.x - right.box.x).map((field) => field.id.slice(prefix.length)), NINJA_STATS);
  }

  const pdf = await PdfDocument.fromBytes(new Uint8Array(await readFile(realPdfUrl)));
  for (const field of config.fields) assert.ok(field.page < pdf.getPageCount());
});

test('every field ID in the JSON corresponds to a real property of the band', async () => {
  const definition = JSON.parse(await readFile(configUrl, 'utf8'));
  const band = new Band();
  const catalog = new GameCatalog(GAME_DATA);
  for (const ninja of band.ninjas) {
    ninja.selectType(catalog.getNinjaType('physical'));
    ninja.techniqueGroup.selectGroup(catalog.getTechniqueGroup('taijutsu'));
  }
  for (const field of definition.fields) {
    const value = field.id.split('.').reduce((current, key) => current?.[key], localizeBand(band));
    assert.notEqual(value, undefined, field.id);
    if (field.type === 'list') assert.ok(Array.isArray(value), field.id);
    if (field.type === 'number') assert.equal(typeof value, 'number', field.id);
    if (field.type === 'boolean') assert.equal(typeof value, 'boolean', field.id);
    if (field.type === 'text') assert.equal(typeof value, 'string', field.id);
  }
});

test('complete configurations can be inspected and field typography overrides preserve defaults', () => {
  const definition = createDefinition();
  definition.fields[0].typography = { fontSize: 14, alignment: 'center' };
  const config = new PdfTemplateConfig(definition, 'https://example.test/app/pdf/templates/layout.json');
  assert.equal(config.isReady(), true);
  assert.doesNotThrow(() => config.assertReady());
  assert.equal(config.resolvePdfUrl(), 'https://example.test/app/pdf/fichas_rellenables.pdf');
  assert.deepEqual(config.getTypography('ninjas.0.name'), {
    font: 'Helvetica', fontSize: 14, fontSizeUnit: 'pt',
    lineHeight: null, alignment: 'center', color: '#000000',
  });
  definition.fields[0].box.x = 999;
  assert.equal(config.getField('ninjas.0.name').box.x, 100);
  assert.throws(() => config.getField('missing'), RangeError);
  assert.throws(() => config.getPageReference(1), RangeError);
});

test('malformed configuration is rejected and explicit null remains an incomplete draft', () => {
  const invalidEdits = [
    (data) => { data.id = ''; },
    (data) => { data.fields.push(structuredClone(data.fields[0])); },
    (data) => { data.fields[0].page = 1; },
    (data) => { data.fields[0].box.width = -1; },
    (data) => { data.fields[0].box.y = undefined; },
    (data) => { data.fields[0].type = 'unknown'; },
    (data) => { data.typography.fontSize = 0; },
    (data) => { data.typography.fontSizeUnit = 'unknown'; },
    (data) => { data.typography.color = 'black'; },
    (data) => { data.fields[0].typography = { alignment: 'unknown' }; },
    (data) => {
      data.pages[0].reference.unit = 'pt';
      data.typography.fontSizeUnit = 'px';
    },
  ];
  for (const edit of invalidEdits) {
    const definition = createDefinition();
    edit(definition);
    assert.throws(() => new PdfTemplateConfig(definition), TypeError);
  }
  const draft = createDefinition();
  draft.pages[0].reference.width = null;
  draft.fields[0].box.x = null;
  const config = new PdfTemplateConfig(draft);
  assert.deepEqual(config.getPendingPages(), [0]);
  assert.deepEqual(config.getPendingFields(), ['ninjas.0.name']);
  assert.equal(config.isReady(), false);
});

test('the JSON loader validates configuration and resolves the PDF path against the response URL', async () => {
  const definition = createDefinition();
  const source = 'https://example.test/subpath/pdf/templates/layout.json';
  const loader = new PdfTemplateConfigLoader(async (url) => {
    assert.equal(url, source);
    return new Response(JSON.stringify(definition), { headers: { 'Content-Type': 'application/json' } });
  });
  const config = await loader.load(source);
  assert.ok(config instanceof PdfTemplateConfig);
  assert.equal(config.resolvePdfUrl(), 'https://example.test/subpath/pdf/fichas_rellenables.pdf');
  assert.equal(config.isReady(), true);
});

test('HTTP failures and invalid JSON do not produce a usable configuration', async () => {
  const source = 'https://example.test/layout.json';
  const missing = new PdfTemplateConfigLoader(async () => new Response('Missing', { status: 404 }));
  await assert.rejects(() => missing.load(source), /HTTP 404/);
  const invalid = new PdfTemplateConfigLoader(async () => new Response('Invalid JSON'));
  await assert.rejects(() => invalid.load(source), SyntaxError);
});
