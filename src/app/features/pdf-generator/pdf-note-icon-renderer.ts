import { degrees, drawImage } from 'pdf-lib';
import type { PdfInlineIcon } from './pdf-types';
import type { PdfIconMarker } from './pdf-note-markers';

export class PdfNoteIconRenderer {
  render(marker: PdfIconMarker, icon: PdfInlineIcon): void {
    const { page, box } = marker;
    const scale = Math.min(box.width / icon.width, box.height / icon.height);
    const width = icon.width * scale;
    const height = icon.height * scale;
    const name = page.node.newXObject('JutsuIcon', icon.ref);
    page.pushOperators(...drawImage(name, {
      x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height,
      rotate: degrees(0), xSkew: degrees(0), ySkew: degrees(0),
    }));
  }
}
