import {
  PDFArray, PDFDict, PDFHexString, PDFName, PDFNumber, PDFString, type PDFPage,
} from 'pdf-lib';
import type { PdfDocument } from './pdf-document';
import type { PdfBox, PdfFormIcon } from './pdf-types';

export interface PdfIconMarker { page: PDFPage; box: PdfBox; }

/** Finds icon positions by note contents and removes the design-time notes. */
export class PdfNoteMarkers {
  extract(pdf: PdfDocument, definitions: readonly PdfFormIcon[]): Map<string, PdfIconMarker> {
    const expected = new Map(definitions.map((definition) => [definition.name.toLowerCase(), definition]));
    if (expected.size !== definitions.length) throw new Error('Duplicate names in the PDF icon mapping.');
    const markers = new Map<string, PdfIconMarker>();
    const removed = new Set<string>();
    for (let index = 0; index < pdf.getPageCount(); index++) {
      const page = pdf.getPage(index);
      for (const ref of page.node.Annots()?.asArray() ?? []) {
        const annotation = page.doc.context.lookup(ref);
        if (!(annotation instanceof PDFDict) || annotation.get(PDFName.of('Subtype'))?.toString() !== '/Text') continue;
        const contents = page.doc.context.lookup(annotation.get(PDFName.of('Contents')));
        if (!(contents instanceof PDFString || contents instanceof PDFHexString)) continue;
        const definition = expected.get(contents.decodeText().trim().toLowerCase());
        if (!definition) continue;
        if (markers.has(definition.name)) throw new Error(`Duplicate PDF icon marker: ${definition.name}`);
        const coordinates = annotation.lookupMaybe(PDFName.of('Rect'), PDFArray)?.asArray()
          .map((value) => value instanceof PDFNumber ? value.asNumber() : NaN) ?? [];
        if (coordinates.length !== 4 || !coordinates.every(Number.isFinite)
          || coordinates[2] <= coordinates[0] || coordinates[3] <= coordinates[1]) {
          throw new Error(`Invalid PDF icon marker rectangle: ${definition.name}`);
        }
        const [x, y, right, top] = coordinates;
        markers.set(definition.name, { page, box: { x, y, width: right - x, height: top - y } });
        removed.add(ref.toString());
      }
    }
    for (const definition of definitions) {
      if (!markers.has(definition.name)) throw new Error(`Missing PDF icon marker: ${definition.name}`);
    }
    for (let index = 0; index < pdf.getPageCount(); index++) {
      const page = pdf.getPage(index);
      const annotations = page.node.Annots();
      for (let item = (annotations?.size() ?? 0) - 1; item >= 0; item--) {
        const ref = annotations!.get(item);
        const dict = page.doc.context.lookup(ref);
        const isPopup = dict instanceof PDFDict && dict.get(PDFName.of('Subtype'))?.toString() === '/Popup'
          && removed.has(dict.get(PDFName.of('Parent'))?.toString() ?? '');
        if (removed.has(ref.toString()) || isPopup) annotations!.remove(item);
      }
    }
    return markers;
  }
}
