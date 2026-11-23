import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'vitest';
import expected from './fixtures/phase5-render-operations.json';
import { Band } from '../src/app/core/models/band';
import { GameCatalog } from '../src/app/core/models/game-catalog';
import { GAME_DATA } from '../src/app/core/services/game-data';
import { BandPdfGenerator } from '../src/app/features/pdf-generator/band-pdf-generator';
import { JutsuPdfTemplate } from '../src/app/features/pdf-generator/jutsu-pdf-template';
import { fetchCoordinateTemplate } from './fixtures/coordinate-template';

// Captured from the original phase 5 engine before migration. Covers all 12 groups.
// Compare text, coordinates, styles, line breaks, font sizes and final baselines.
test('the coordinate backend matches the original phase 5 rendering for all twelve technique groups', async () => {
  const catalog = new GameCatalog(GAME_DATA);
  const template = { ...new JutsuPdfTemplate(pathToFileURL(resolve(process.cwd(), 'src/assets') + '/')),
    formFields: undefined, repeatedSheet: undefined };
  for (let offset = 0; offset < 12; offset += 3) {
    const band = new Band();
    band.ninjas.forEach((ninja, i) => {
      ninja.name = ['Águila', 'Kaede', 'Maestro Ñ'][i];
      ninja.selectType(catalog.ninjaTypes[i]);
      ninja.techniqueGroup.selectGroup(catalog.techniqueGroups[offset + i]);
      for (const kind of ['weapons', 'items']) {
        ninja.equipment.addEntry(kind);
        ninja.equipment.selectEntry(kind, 0, catalog.getEquipment(kind)[i]);
      }
    });
    const operations = [];
    const generator = new BandPdfGenerator({ fetchResource: (url) => fetchCoordinateTemplate(url, template.pdfUrl) });
    const renderer = generator.renderer;
    generator.renderer = { render(page, text, box, style, family) {
      operations.push({ text, box, style, layout: renderer.layout.fit(text, family, box, style) });
      renderer.render(page, text, box, style, family);
    } };
    await generator.generate(band, template);
    assert.deepEqual(operations, expected[offset / 3]);
  }
});
