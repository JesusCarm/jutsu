import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, test, vi } from 'vitest';
import { PDFDocument, PDFDict, PDFName, decodePDFRawStream } from 'pdf-lib';
import { Band } from '../src/app/core/models/band';
import { GameCatalog } from '../src/app/core/models/game-catalog';
import { GAME_DATA } from '../src/app/core/services/game-data';
import { BandPdfGenerator } from '../src/app/features/pdf-generator/band-pdf-generator';
import { NinjaGridPdfTemplate } from '../src/app/features/pdf-generator/ninja-grid-pdf-template';
import { PdfFieldRenderer } from '../src/app/features/pdf-generator/pdf-field-renderer';
import { PdfIconProvider } from '../src/app/features/pdf-generator/pdf-icon-provider';
import { PdfNoteIconRenderer } from '../src/app/features/pdf-generator/pdf-note-icon-renderer';
import { localizeBand } from './fixtures/localized-band.js';

const template = new NinjaGridPdfTemplate(pathToFileURL(resolve('src/assets') + '/'));
const catalog = new GameCatalog(GAME_DATA);
const fetchLocal = async (url) => new Response(await readFile(new URL(url)));
const generator = new BandPdfGenerator({ fetchResource: fetchLocal });
afterEach(() => vi.restoreAllMocks());

function squad(offset = 0) {
  const band = new Band();
  band.name = 'The Ravens';
  band.ninjas.forEach((ninja, index) => {
    ninja.name = ['Renée → ≥', 'Kaede', 'Master Ñ'][index];
    ninja.selectType(catalog.ninjaTypes[index]);
    ninja.techniqueGroup.selectGroup(catalog.techniqueGroups[offset + index]);
    catalog.weapons.forEach((entry, slot) => ninja.equipment.selectSlot('weapons', slot, entry));
    ninja.equipment.selectSlot('items', 0, catalog.items[index]);
    ninja.equipment.selectSlot('items', 1, catalog.items[index + 1]);
  });
  return band;
}

async function preview(name, bytes) {
  if (!process.env.JUTSU_PDF_PREVIEW_DIR) return;
  await mkdir(process.env.JUTSU_PDF_PREVIEW_DIR, { recursive: true });
  await writeFile(resolve(process.env.JUTSU_PDF_PREVIEW_DIR, name), bytes);
}

test('fits all schools on one landscape A5 with a single equipment icon row per ninja', async () => {
  const render = vi.spyOn(PdfFieldRenderer.prototype, 'render');
  const drawIcon = vi.spyOn(PdfNoteIconRenderer.prototype, 'render');
  const getIcon = vi.spyOn(PdfIconProvider.prototype, 'get');
  for (const language of ['en', 'es']) {
    for (let offset = 0; offset < 12; offset += 3) {
      render.mockClear();
      drawIcon.mockClear();
      getIcon.mockClear();
      const source = squad(offset);
      const before = JSON.stringify(source);
      const band = localizeBand(source, language);
      const requests = [];
      const bytes = await new BandPdfGenerator({ fetchResource: async (url) => {
        requests.push(url); return fetchLocal(url);
      } }).generate(band, structuredClone(template));
      const pdf = await PDFDocument.load(bytes);
      let embeddedDetails = 0;
      assert.equal(pdf.getPageCount(), 1, `School set ${offset / 3 + 1} in ${language}`);
      assert.equal(pdf.catalog.has(PDFName.of('AcroForm')), false);
      for (const page of pdf.getPages()) {
        assert.deepEqual(page.getSize(), { width: 595.28, height: 419.53 });
        assert.equal(page.node.Annots()?.size() ?? 0, 0);
        const icons = page.node.Resources().lookup(PDFName.of('XObject'), PDFDict).entries();
        assert.ok(icons.length > 0);
        for (const [, ref] of icons) {
          const icon = pdf.context.lookup(ref);
          assert.equal(icon.dict.get(PDFName.of('Subtype')).toString(), '/Form');
          const details = icon.dict.lookup(PDFName.of('Resources'), PDFDict).lookupMaybe(PDFName.of('XObject'), PDFDict);
          for (const [, detail] of details?.entries() ?? []) {
            assert.equal(pdf.context.lookup(detail).dict.get(PDFName.of('Subtype')).toString(), '/Image');
            embeddedDetails++;
          }
        }
      }
      assert.ok(embeddedDetails > 0, 'Embedded PNG details from the original SVG assets are preserved');
      const calls = render.mock.calls;
      const inventoryNames = ['weapons', 'equipment', 'kunai', 'shuriken', 'seal', 'smoke', 'pill', 'healing', 'potion'];
      const inventoryIcons = drawIcon.mock.calls.map(([marker], index) => ({ name: getIcon.mock.calls[index][0], ...marker }))
        .filter((icon) => inventoryNames.includes(icon.name));
      for (const [index, ninja] of band.ninjas.entries()) {
        const columnWidth = (595.28 - 28 - 16) / 3;
        const left = 22 + index * (columnWidth + 8);
        const inColumn = calls.filter(([, , box]) => box.x >= left - 1e-6 && box.x + box.width <= left + columnWidth - 16 + 1e-6)
          .map(([, text]) => text);
        for (const value of [ninja.name, ninja.type, ninja.techniqueGroup.name]) assert.ok(inColumn.includes(value), value);
        for (const entry of [...ninja.equipment.weapons, ...ninja.equipment.items]) {
          assert.ok(!inColumn.includes(entry.name));
          assert.ok(!inColumn.includes(entry.description));
          assert.ok(!inColumn.includes(entry.cost));
        }
        const equipment = inventoryIcons.filter(({ box }) => box.x >= left && box.x < left + columnWidth - 16);
        assert.equal(equipment.length, 7, 'Two category icons and five equipped slots');
        assert.equal(new Set(equipment.map(({ box }) => box.y)).size, 1, 'All equipment icons share one row');
        for (const technique of ninja.techniqueGroup.techniques) {
          assert.ok(inColumn.includes(technique.name)); assert.ok(inColumn.includes(technique.description));
          assert.ok(inColumn.includes(technique.chakra));
        }
        assert.equal(inColumn.filter((text) => text === band.labels.mokushin).length,
          ninja.techniqueGroup.techniques.filter((technique) => technique.isMokushin).length);
      }
      for (const [page, , box] of calls) {
        assert.ok(box.x >= 14 && box.x + box.width <= page.getWidth() - 14 + 1e-6);
        assert.ok(box.y >= 2 && box.y + box.height <= page.getHeight() - 14 + 1e-6);
      }
      assert.equal(new Set(requests).size, requests.length, 'Fonts and icons are fetched only once per document');
      assert.ok(requests.every((url) => !url.endsWith('.pdf') && !url.endsWith('.json')));
      assert.equal(JSON.stringify(source), before);
      await preview(`ninja-grid-${language}-${offset / 3 + 1}.pdf`, bytes);
    }
  }
}, 30000);

test('prints empty selections with translated placeholders and preserves zero stats', async () => {
  const render = vi.spyOn(PdfFieldRenderer.prototype, 'render');
  const band = localizeBand(new Band(), 'es');
  band.ninjas[1].stats.chakra = 0;
  const bytes = await generator.generate(band, template);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  const texts = render.mock.calls.map(([, text]) => text);
  for (const text of ['Ninja 1', 'Ninja 2', 'Ninja 3', band.labels.noType, band.labels.emptyTechniques, '0', '—']) {
    assert.ok(texts.includes(text), text);
  }
  assert.ok(!texts.includes('undefined'));
  await preview('ninja-grid-empty.pdf', bytes);
});

test('continues an overflowing column without clipping or dropping complete technique blocks', async () => {
  const render = vi.spyOn(PdfFieldRenderer.prototype, 'render');
  const band = localizeBand(squad());
  band.ninjas[0].techniqueGroup.techniques.push(...band.ninjas[0].techniqueGroup.techniques.map((entry) => ({ ...entry, name: entry.name + ' continued' })));
  const bytes = await generator.generate(band, template);
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() > 1);
  const continued = render.mock.calls.find(([, text]) => text === 'Gate of Strength continued');
  assert.ok(continued);
  assert.ok(continued[0].doc.getPages().indexOf(continued[0]) > 0);
  for (const [, , box] of render.mock.calls) assert.ok(box.y >= 2);
  const content = pdf.getPages().flatMap((page) => page.node.Contents().asArray()
    .map((ref) => new TextDecoder().decode(decodePDFRawStream(pdf.context.lookup(ref)).decode()))).join('\n');
  assert.match(content, /\bBT\b/);
  assert.match(content, /\bTj\b/);
  await preview('ninja-grid-continuation.pdf', bytes);
});

test('rejects malformed squads and reports unavailable resources', async () => {
  await assert.rejects(() => generator.generate({ ninjas: [] }, template), /exactly 3 ninjas/);
  await assert.rejects(() => new BandPdfGenerator({ fetchResource: async () => new Response('', { status: 404 }) })
    .generate(localizeBand(new Band()), template), /Unable to load font/);
  const band = localizeBand(new Band());
  band.ninjas[1].displayName = 'W'.repeat(3000);
  await assert.rejects(() => generator.generate(band, template), /Unable to generate ninja 2: A grid section is too tall/);
});
