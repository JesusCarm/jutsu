import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { PdfDocument } from '../src/app/features/pdf-generator/pdf-document';
import { PdfTemplateLoader } from '../src/app/features/pdf-generator/pdf-template-loader';

const templateUrl = pathToFileURL(resolve(process.cwd(), 'public/templates/test-template.pdf'));
const suppliedTemplateUrl = pathToFileURL(resolve(process.cwd(), 'src/assets/pdf/fichas_rellenables.pdf'));
const suppliedPage = { index: 0, width: 595.44, height: 288 };
const expectedPages = [
  { index: 0, width: 595.28, height: 841.89 },
  { index: 1, width: 419.53, height: 595.28 },
];

test('loads the supplied Affinity template and saves it in memory without changing the original', async () => {
  const original = await readFile(suppliedTemplateUrl);
  const pdf = await PdfDocument.fromBytes(new Uint8Array(original));
  assert.equal(pdf.getPageCount(), 1);
  assert.deepEqual(pdf.getPagesInfo(), [suppliedPage]);
  await pdf.prepareForText();

  const saved = await pdf.save();
  assert.ok(saved instanceof Uint8Array);
  const reopened = await PdfDocument.fromBytes(saved);
  assert.deepEqual(reopened.getPagesInfo(), [suppliedPage]);
  assert.deepEqual(await readFile(suppliedTemplateUrl), original);

  const originalDocument = await PDFDocument.load(new Uint8Array(original), { updateMetadata: false });
  const savedDocument = await PDFDocument.load(saved, { updateMetadata: false });
  assert.equal(savedDocument.getTitle(), originalDocument.getTitle());
  assert.equal(savedDocument.getCreator(), originalDocument.getCreator());
});

test('the loader accepts the supplied template URL and returns its actual page dimensions', async () => {
  const bytes = await readFile(suppliedTemplateUrl);
  const path = '/src/pdf/fichas_rellenables.pdf';
  const loader = new PdfTemplateLoader(async (url) => {
    assert.equal(url, path);
    return new Response(bytes, { headers: { 'Content-Type': 'application/pdf' } });
  });
  const pdf = await loader.load(path);
  assert.deepEqual(pdf.getPageInfo(0), suppliedPage);
});

test('loads the existing template and identifies both pages and their different dimensions', async () => {
  const bytes = await readFile(templateUrl);
  const pdf = await PdfDocument.fromBytes(new Uint8Array(bytes));
  assert.equal(pdf.getPageCount(), 2);
  assert.deepEqual(pdf.getPagesInfo(), expectedPages);
  assert.deepEqual(pdf.getPageInfo(1), expectedPages[1]);

  const info = pdf.getPageInfo(0);
  info.width = 1;
  assert.equal(pdf.getPageInfo(0).width, expectedPages[0].width);
});

test('rejects invalid page indexes instead of accessing or modifying another page', async () => {
  const pdf = await PdfDocument.fromBytes(new Uint8Array(await readFile(templateUrl)));
  for (const index of [-1, 2, 0.5, NaN, undefined]) {
    assert.throws(() => pdf.getPage(index), RangeError);
    assert.throws(() => pdf.getPageInfo(index), RangeError);
  }
});

test('prepares text resources once and saves a modified PDF in memory that can be reopened', async () => {
  const original = await readFile(templateUrl);
  const pdf = await PdfDocument.fromBytes(new Uint8Array(original));
  const [font, sameFont] = await Promise.all([pdf.prepareForText(), pdf.prepareForText()]);
  assert.equal(font, sameFont);

  pdf.getPage(0).drawText('Phase 3 memory test', {
    x: 60, y: 581.89, size: 14, font,
  });
  const saved = await pdf.save();
  assert.ok(saved instanceof Uint8Array);
  assert.notDeepEqual(saved, new Uint8Array(original));

  const reopened = await PdfDocument.fromBytes(saved);
  assert.deepEqual(reopened.getPagesInfo(), expectedPages);
  assert.deepEqual(await readFile(templateUrl), original);
  const originalDocument = await PDFDocument.load(new Uint8Array(original), { updateMetadata: false });
  const savedDocument = await PDFDocument.load(saved, { updateMetadata: false });
  assert.equal(savedDocument.getTitle(), originalDocument.getTitle());
  assert.equal(savedDocument.getAuthor(), originalDocument.getAuthor());
});

test('separate loads create independent documents and leave the source template unchanged', async () => {
  const bytes = await readFile(templateUrl);
  const first = await PdfDocument.fromBytes(new Uint8Array(bytes));
  const second = await PdfDocument.fromBytes(new Uint8Array(bytes));
  first.getPage(0).setSize(300, 400);
  assert.deepEqual(first.getPageInfo(0), { index: 0, width: 300, height: 400 });
  assert.deepEqual(second.getPageInfo(0), expectedPages[0]);
  assert.deepEqual(await readFile(templateUrl), bytes);
});

test('the template loader requests the supplied URL and returns a ready PDF document', async () => {
  const bytes = await readFile(templateUrl);
  const requested = [];
  const loader = new PdfTemplateLoader(async (url) => {
    requested.push(url);
    return new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/pdf' } });
  });

  const pdf = await loader.load('/templates/test-template.pdf');
  assert.deepEqual(requested, ['/templates/test-template.pdf']);
  assert.ok(pdf instanceof PdfDocument);
  assert.deepEqual(pdf.getPagesInfo(), expectedPages);
  assert.ok((await pdf.save()) instanceof Uint8Array);
});

test('failed requests and invalid PDF bodies do not produce a usable document', async () => {
  const missing = new PdfTemplateLoader(async () => new Response('Missing', { status: 404 }));
  await assert.rejects(() => missing.load('/missing.pdf'), /HTTP 404/);

  const invalid = new PdfTemplateLoader(async () => new Response('<html>Not a PDF</html>'));
  await assert.rejects(() => invalid.load('/invalid.pdf'), /No PDF header found/);

  const networkError = new TypeError('Network request failed');
  const unavailable = new PdfTemplateLoader(async () => { throw networkError; });
  await assert.rejects(() => unavailable.load('/unavailable.pdf'), (error) => error === networkError);
});
