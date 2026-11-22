import type { PdfFontFamily } from './pdf-font-family';
import type { PdfBox, ReadyTypography } from './pdf-types';
export class PdfTextLayout {
  wrap(text: string, family: PdfFontFamily, size: number, width: number) {
    const lines = [];
    const measure = (value: string) => family.getTextMetrics(value, size).width;
    for (const paragraph of text.split('\n')) {
      let line = '';
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (measure(candidate) <= width + 1e-6) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        if (measure(word) <= width + 1e-6) { line = word; continue; }
        for (const character of word) {
          if (measure(character) > width + 1e-6) return null;
          if (line && measure(line + character) > width + 1e-6) { lines.push(line); line = ''; }
          line += character;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  fit(text: string, family: PdfFontFamily, box: PdfBox, style: ReadyTypography) {
    const minimum = style.minFontSize ?? style.fontSize;
    let size = style.fontSize;
    while (true) {
      const lines = this.wrap(text, family, size, box.width);
      if (lines) {
        const metrics = lines.map((line) => family.getTextMetrics(line, size));
        const maxAscent = Math.max(...metrics.map((entry) => entry.ascent));
        const maxDescent = Math.max(...metrics.map((entry) => entry.descent));
        const lineHeight = style.lineHeight == null
          ? Math.max(size * 1.2, (maxAscent + maxDescent) * 1.05)
          : style.lineHeight * size / style.fontSize;
        const height = metrics[0].ascent + (lines.length - 1) * lineHeight + metrics.at(-1)!.descent;
        if (height <= box.height + 1e-6 && (lines.length === 1 || lineHeight >= maxAscent + maxDescent)) {
          const remaining = box.height - height;
          const offset = style.verticalAlignment === 'middle' ? remaining / 2
            : style.verticalAlignment === 'bottom' ? remaining : 0;
          const baseline = box.y + box.height - offset - metrics[0].ascent;
          return {
            fontSize: size,
            lines: lines.map((line, index) => {
              const extra = box.width - metrics[index].width;
              const alignment = style.alignment === 'center' ? extra / 2 : style.alignment === 'right' ? extra : 0;
              return { text: line, x: box.x + alignment - metrics[index].left, y: baseline - index * lineHeight };
            }),
          };
        }
      }
      if (size <= minimum) throw new Error('Text does not fit the configured box at the minimum font size.');
      size = Math.max(minimum, size - 0.25);
    }
  }
}
