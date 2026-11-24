import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'vitest';
import { PDFDocument, PDFDict, PDFName, PDFHexString, decodePDFRawStream } from 'pdf-lib';
import { Band } from '../src/app/core/models/band';
import { GameCatalog } from '../src/app/core/models/game-catalog';
import { GAME_DATA } from '../src/app/core/services/game-data';
import { BandPdfGenerator } from '../src/app/features/pdf-generator/band-pdf-generator';
import { JutsuPdfTemplate } from '../src/app/features/pdf-generator/jutsu-pdf-template';
import { PdfFormValueFormatter } from '../src/app/features/pdf-generator/pdf-form-value-formatter';

const exportTemplate = new JutsuPdfTemplate(pathToFileURL(resolve(process.cwd(), 'src/assets') + '/'));
const cardTemplate = { ...exportTemplate, repeatedSheet: undefined };
const editableTemplate = { ...cardTemplate, formOutput: 'editable' };
const catalog = new GameCatalog(GAME_DATA);
const fetchLocal = async (url) => new Response(await readFile(new URL(url)));
const nameOf = (index, suffix) => 'Ninja1_technique_' + (index + 1) + suffix;
const resourceEntries = (dict, key) => dict.lookupMaybe(PDFName.of(key), PDFDict)?.entries() ?? [];
const iconEntries = (resources) => resourceEntries(resources, 'XObject').filter(([name]) => name.decodeText().startsWith('JutsuIcon'));

function createBand(offset = 0) {
  const band = new Band();
  band.name = 'Ravens';
  band.ninjas.forEach((ninja, index) => {
    ninja.name = ['Renée', 'Kaede', 'Master Ñ'][index];
    ninja.selectType(catalog.ninjaTypes[index]);
    ninja.techniqueGroup.selectGroup(catalog.techniqueGroups[offset + index]);
    catalog.weapons.forEach((weapon, slot) => ninja.equipment.selectSlot('weapons', slot, weapon));
    ninja.equipment.selectSlot('items', 0, catalog.items[index]);
    ninja.equipment.selectSlot('items', 1, catalog.items[index + 1]);
  });
  return band;
}

function inherited(dict, name) {
  const value = dict.get(PDFName.of(name));
  if (value !== undefined) return dict.context.lookup(value);
  const parent = dict.lookupMaybe(PDFName.of('Parent'), PDFDict);
  return parent ? inherited(parent, name) : undefined;
}

function annotations(document, subtype) {
  return document.getPage(0).node.Annots()?.asArray().map((ref) => document.context.lookup(ref, PDFDict))
    .filter((dict) => dict.get(PDFName.of('Subtype'))?.toString() === '/' + subtype) ?? [];
}

async function preview(name, bytes) {
  if (!process.env.JUTSU_PDF_PREVIEW_DIR) return;
  await mkdir(process.env.JUTSU_PDF_PREVIEW_DIR, { recursive: true });
  await writeFile(resolve(process.env.JUTSU_PDF_PREVIEW_DIR, name), bytes);
}

function assertVectorIcon(document, ref) {
  const icon = document.context.lookup(ref);
  assert.equal(icon.dict.get(PDFName.of('Subtype')).toString(), '/Form');
  const bounds = icon.dict.lookup(PDFName.of('BBox')).asArray().map((number) => number.asNumber());
  const matrix = icon.dict.lookup(PDFName.of('Matrix')).asArray().map((number) => number.asNumber());
  assert.ok(Math.abs(matrix[0] * (bounds[2] - bounds[0]) - 1) < 1e-6);
  assert.ok(Math.abs(matrix[3] * (bounds[3] - bounds[1]) - 1) < 1e-6);
  assert.ok(decodePDFRawStream(icon).decode().length > 0);
}

test('fills the single-card fields, separate chakra costs and named note positions without changing the source or band', async () => {
  const source = await readFile(new URL(exportTemplate.pdfUrl));
  const band = createBand();
  band.ninjas[0].name = 'Renée → ≥';
  band.ninjas[0].selectType({ name: 'Physical', stats: { ...catalog.ninjaTypes[0].stats, chakra: 0 } });
  const before = JSON.stringify(band);
  const requests = [];
  const bytes = await new BandPdfGenerator({ fetchResource: async (url) => { requests.push(url); return fetchLocal(url); } })
    .generate(band, editableTemplate);
  const document = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = document.getForm();
  assert.equal(form.getFields().length, 15);
  for (const [name, value] of Object.entries({
    Ninja1_name: 'Renée → ≥', Ninja1_stats_attack: '6', Ninja1_stats_hability: '4',
    Ninja1_stats_chakra: '0', Ninja1_stats_life: '10', Ninja1_technique_group: 'Taijutsu',
    Ninja1_items_and_weapons: 'Kunai, Shuriken, Explosive Seal, Smoke Bomb, Soldier Pill',
    Ninja1_technique_1: 'Protective Gate\nMokushin: Cancel 1 attacker success per Chakra spent. Max 5.',
    Ninja1_technique_1_cost: '1–5', Ninja1_technique_2_cost: '1–3',
  })) assert.equal(form.getTextField(name).getText(), value);
  for (const field of form.getFields()) {
    assert.equal(field.isReadOnly(), false);
    assert.equal(field.isMultiline(), /_technique_[123]$/.test(field.getName()));
    for (const widget of field.acroField.getWidgets()) {
      assert.equal(inherited(widget.dict, 'V').decodeText(), field.getText());
      const normal = widget.getAppearances().normal;
      assert.ok(normal.getContents().length > 0);
      assert.equal(resourceEntries(normal.dict.lookup(PDFName.of('Resources'), PDFDict), 'Font').length, 2);
    }
  }
  assert.equal(annotations(document, 'Text').length, 0, 'Marker notes must disappear after filling');
  assert.equal(iconEntries(document.getPage(0).node.Resources()).length, 1);
  assert.equal(requests.filter((url) => url === exportTemplate.iconUrls.mokushin).length, 1);
  assert.ok(!requests.includes(exportTemplate.configUrl));
  assert.equal(JSON.stringify(band), before);
  assert.deepEqual(await readFile(new URL(exportTemplate.pdfUrl)), source);
});

test('all twelve groups fill body and cost separately and use case-insensitive note identifiers for Mokushin', async () => {
  for (let offset = 0; offset < 12; offset += 3) {
    for (const ninja of createBand(offset).ninjas) {
      const bytes = await new BandPdfGenerator({ fetchResource: fetchLocal }).generate({ ninjas: [ninja] }, editableTemplate);
      const document = await PDFDocument.load(bytes);
      const form = document.getForm();
      for (const [index, technique] of ninja.techniqueGroup.techniques.entries()) {
        assert.equal(form.getTextField(nameOf(index, '')).getText(), technique.name + '\n' + technique.description);
        assert.equal(form.getTextField(nameOf(index, '_cost')).getText(), String(technique.chakra));
      }
      assert.equal(iconEntries(document.getPage(0).node.Resources()).length,
        ninja.techniqueGroup.techniques.filter((technique) => technique.isMokushin).length);
      assert.equal(annotations(document, 'Text').length, 0);
    }
  }
});

test('the default export composes three independent vector cards on A4 with all costs, selective icons and no forms or notes', async () => {
  const source = await readFile(new URL(exportTemplate.pdfUrl));
  for (let offset = 0; offset < 12; offset += 3) {
    const band = createBand(offset);
    const requests = [];
    const before = JSON.stringify(band);
    const bytes = await new BandPdfGenerator({ fetchResource: async (url) => { requests.push(url); return fetchLocal(url); } })
      .generate(band, exportTemplate);
    const document = await PDFDocument.load(bytes, { updateMetadata: false });
    assert.equal(document.getPageCount(), 1);
    assert.deepEqual(document.getPage(0).getSize(), { width: 595.28, height: 841.89 });
    assert.equal(document.catalog.has(PDFName.of('AcroForm')), false);
    assert.equal(document.getPage(0).node.Annots()?.size() ?? 0, 0);
    const cards = resourceEntries(document.getPage(0).node.Resources(), 'XObject');
    assert.equal(cards.length, 3);
    for (const [index, [, ref]] of cards.entries()) {
      const card = document.context.lookup(ref);
      assert.equal(card.dict.get(PDFName.of('Subtype')).toString(), '/Form');
      const resources = card.dict.lookup(PDFName.of('Resources'), PDFDict);
      const fields = resourceEntries(resources, 'XObject').filter(([name]) => name.decodeText().startsWith('FlatWidget'));
      assert.equal(fields.length, 15);
      for (const [, fieldRef] of fields) {
        const appearance = document.context.lookup(fieldRef);
        const operators = new TextDecoder().decode(decodePDFRawStream(appearance).decode());
        assert.match(operators, /\bBT\b[\s\S]*\bTj\b[\s\S]*\bET\b/);
        assert.doesNotMatch(operators, /^(?:S|s|f|F|f\*|B|B\*|b|b\*)$/m, 'Field borders must not be painted');
      }
      const icons = iconEntries(resources);
      assert.equal(icons.length, band.ninjas[index].techniqueGroup.techniques.filter((technique) => technique.isMokushin).length);
      const uniqueIcons = new Set(icons.map(([, iconRef]) => iconRef.toString()));
      assert.equal(uniqueIcons.size, icons.length ? 1 : 0);
      for (const [, iconRef] of icons) assertVectorIcon(document, iconRef);
    }
    for (const url of [exportTemplate.pdfUrl, ...Object.values(exportTemplate.fontUrls), exportTemplate.iconUrls.mokushin]) {
      assert.equal(requests.filter((request) => request === url).length, 1, url);
    }
    assert.equal(JSON.stringify(band), before);
    await preview('three-cards-review-' + (offset / 3 + 1) + '.pdf', bytes);
  }
  assert.deepEqual(await readFile(new URL(exportTemplate.pdfUrl)), source);
});

test('unselected data clears stale card values and cost fields, removes all notes and does not load the icon', async () => {
  const original = await PDFDocument.load(new Uint8Array(await readFile(new URL(exportTemplate.pdfUrl))));
  original.getForm().getFields().forEach((field) => field.setText('Stale'));
  const modified = await original.save();
  const band = new Band();
  band.ninjas[0].equipment.selectSlot('weapons', 2, catalog.weapons[1]);
  const requests = [];
  const bytes = await new BandPdfGenerator({ fetchResource: async (url) => {
    requests.push(url);
    return url === exportTemplate.pdfUrl ? new Response(modified) : fetchLocal(url);
  } }).generate(band, editableTemplate);
  const document = await PDFDocument.load(bytes);
  for (const name of ['Ninja1_name', 'Ninja1_stats_life', 'Ninja1_technique_1', 'Ninja1_technique_1_cost']) {
    const field = document.getForm().getTextField(name);
    assert.equal(field.getText(), undefined);
    for (const widget of field.acroField.getWidgets()) assert.equal(inherited(widget.dict, 'V'), undefined);
  }
  assert.equal(document.getForm().getTextField('Ninja1_items_and_weapons').getText(), 'Shuriken');
  assert.equal(annotations(document, 'Text').length, 0);
  assert.equal(iconEntries(document.getPage(0).node.Resources()).length, 0);
  assert.ok(!requests.includes(exportTemplate.iconUrls.mokushin));
});

test('missing, duplicate or invalid note markers fail before loading fonts', async () => {
  for (const problem of ['missing', 'duplicate', 'rectangle']) {
    const document = await PDFDocument.load(new Uint8Array(await readFile(new URL(exportTemplate.pdfUrl))));
    const notes = annotations(document, 'Text');
    const marker = notes.find((note) => note.get(PDFName.of('Contents')).decodeText().toLowerCase().endsWith('_1_mokushin'));
    if (problem === 'missing') marker.set(PDFName.of('Contents'), PDFHexString.fromText('Renamed'));
    if (problem === 'duplicate') notes.find((note) => note !== marker).set(PDFName.of('Contents'), marker.get(PDFName.of('Contents')));
    if (problem === 'rectangle') marker.set(PDFName.of('Rect'), document.context.obj([0, 0, 0, 0]));
    const modified = await document.save();
    const requests = [];
    await assert.rejects(() => new BandPdfGenerator({ fetchResource: async (url) => { requests.push(url); return new Response(modified); } })
      .generate(createBand(), cardTemplate), new RegExp(problem === 'missing' ? 'Missing PDF icon marker' : problem === 'duplicate' ? 'Duplicate PDF icon marker' : 'Invalid PDF icon marker rectangle'));
    assert.deepEqual(requests, [exportTemplate.pdfUrl]);
  }
});

test('missing or duplicate form field names fail before loading fonts', async () => {
  for (const replacement of ['Renamed_field', 'Ninja1_name']) {
    const document = await PDFDocument.load(new Uint8Array(await readFile(new URL(exportTemplate.pdfUrl))));
    document.getForm().getTextField('Ninja1_items_and_weapons').acroField.setPartialName(replacement);
    const modified = await document.save();
    const requests = [];
    await assert.rejects(() => new BandPdfGenerator({ fetchResource: async (url) => { requests.push(url); return new Response(modified); } })
      .generate(createBand(), cardTemplate), replacement === 'Renamed_field'
      ? /Missing PDF form field: Ninja1_items_and_weapons/ : /Duplicate PDF form field: Ninja1_name/);
    assert.deepEqual(requests, [exportTemplate.pdfUrl]);
  }
});

test('orphan widgets are rejected instead of writing an inconsistent AcroForm', async () => {
  const document = await PDFDocument.load(new Uint8Array(await readFile(new URL(exportTemplate.pdfUrl))));
  const orphan = document.context.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', T: PDFHexString.fromText('Orphan'), Rect: [0, 0, 50, 10] });
  document.getPage(0).node.addAnnot(document.context.register(orphan));
  const modified = await document.save();
  await assert.rejects(() => new BandPdfGenerator({ fetchResource: async () => new Response(modified) })
    .generate(createBand(), cardTemplate), /orphaned form widget/);
});

test('overflow reports both the ninja and affected field', async () => {
  const band = createBand();
  band.ninjas[1].name = 'W'.repeat(1000);
  await assert.rejects(() => new BandPdfGenerator({ fetchResource: fetchLocal }).generate(band, exportTemplate),
    /Unable to generate ninja 2: Unable to fill Ninja1_name: Text does not fit/);
});

test('technique bodies preserve rules and Unicode while separate costs accept numbers, ranges and maintenance costs', () => {
  const formatter = new PdfFormValueFormatter();
  assert.equal(formatter.format(null, 'technique'), '');
  assert.equal(formatter.format({ name: 'Test', description: 'Action/Mokushin: Move → ≥ 2', chakra: '3 + 1/round', isMokushin: true }, 'technique'),
    'Test\nAction/Mokushin: Move → ≥ 2');
  for (const cost of [0, 5, '1–3', '1–5', '3 + 1/round']) assert.equal(formatter.format(cost, 'text'), String(cost));
  assert.throws(() => formatter.format({ name: 'Broken' }, 'technique'), /requires a name/);
});

test('a missing SVG identifies the named Mokushin marker and ninja', async () => {
  await assert.rejects(() => new BandPdfGenerator({ fetchResource: async (url) => url === exportTemplate.iconUrls.mokushin
    ? new Response('Missing', { status: 404 }) : fetchLocal(url) }).generate(createBand(), exportTemplate),
  /Unable to generate ninja 1: Unable to render Ninja1_technique_1_mokushin: Unable to load PDF icon mokushin: 404/);
});

test('a repeated sheet requires exactly three ninjas and static output', async () => {
  const generator = new BandPdfGenerator({ fetchResource: fetchLocal });
  await assert.rejects(() => generator.generate({ ninjas: [{}] }, exportTemplate), /requires exactly 3 ninjas/);
  await assert.rejects(() => generator.generate(createBand(), { ...exportTemplate, formOutput: 'editable' }), /flattened form output/);
});
