import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

// Keep the legacy compositor reference independent of the current card artwork.
export async function fetchCoordinateTemplate(url, pdfUrl) {
  if (url !== pdfUrl) return new Response(await readFile(new URL(url)));
  const document = await PDFDocument.create();
  document.addPage([595.44, 841.92]);
  return new Response(await document.save());
}
