import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'vitest';
import expected from './fixtures/phase5-render-operations.json';
import phase5GameData from './fixtures/phase5-game-data.json';
import { BandPdfGenerator } from '../src/app/features/pdf-generator/band-pdf-generator';
import { JutsuPdfTemplate } from '../src/app/features/pdf-generator/jutsu-pdf-template';
import { fetchCoordinateTemplate } from './fixtures/coordinate-template';

// Captured from the original phase 5 engine before migration. Covers all 12 groups.
// Compare text, coordinates, styles, line breaks, font sizes and final baselines.
// Preserve the original rules and Unicode sample names with this historical reference.
test('the coordinate backend matches the original phase 5 rendering for all twelve technique groups', async () => {
  const catalog = phase5GameData;
  const template = { ...new JutsuPdfTemplate(pathToFileURL(resolve(process.cwd(), 'src/assets') + '/')),
    formFields: undefined, repeatedSheet: undefined };
  for (let offset = 0; offset < 12; offset += 3) {
    const band = { name: '', ninjas: Array.from({ length: 3 }, (_, i) => ({
      name: ['Águila', 'Kaede', 'Maestro Ñ'][i], type: catalog.ninjaTypes[i].name,
      stats: catalog.ninjaTypes[i].stats, techniqueGroup: catalog.techniqueGroups[offset + i],
      equipment: { weapons: [catalog.weapons[i]], items: [catalog.items[i]] },
    })) };
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
