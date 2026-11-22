import type { FontRecord, FontRun, RunMetrics, TextMetrics } from './pdf-types';
export class PdfFontFamily {
  readonly runs = new Map<string, FontRun[]>();
  readonly measurements = new Map<FontRecord, Map<string, RunMetrics>>();

  constructor(readonly fonts: FontRecord[]) {
  }

  getRuns(text: string): FontRun[] {
    if (this.runs.has(text)) return this.runs.get(text)!;
    const runs: FontRun[] = [];
    for (const character of text) {
      const record = this.fonts.find((entry) => entry.characters.has(character.codePointAt(0)!));
      if (!record) throw new Error(`The configured fonts do not support U+${character.codePointAt(0)!.toString(16).toUpperCase()}.`);
      const previous = runs.at(-1);
      if (previous?.record === record) previous.text += character;
      else runs.push({ record, text: character });
    }
    this.runs.set(text, runs);
    return runs;
  }

  getRunMetrics(record: FontRecord, text: string): RunMetrics {
    let cache = this.measurements.get(record);
    if (!cache) { cache = new Map(); this.measurements.set(record, cache); }
    if (cache.has(text)) return cache.get(text)!;
    let metrics;
    if (record.raw) {
      const run = record.raw.layout(text);
      const units = record.raw.unitsPerEm;
      metrics = {
        advance: run.advanceWidth / units,
        left: Number.isFinite(run.bbox.minX) ? run.bbox.minX / units : 0,
        right: Number.isFinite(run.bbox.maxX) ? run.bbox.maxX / units : 0,
        ascent: Number.isFinite(run.bbox.maxY) ? Math.max(0, run.bbox.maxY / units) : 0,
        descent: Number.isFinite(run.bbox.minY) ? Math.max(0, -run.bbox.minY / units) : 0,
      };
    } else {
      const ascent = record.font.heightAtSize(1, { descender: false });
      const width = record.font.widthOfTextAtSize(text, 1);
      metrics = { advance: width, left: 0, right: width, ascent, descent: record.font.heightAtSize(1) - ascent };
    }
    cache.set(text, metrics);
    return metrics;
  }

  getTextMetrics(text: string, size: number): TextMetrics {
    let advance = 0, left = 0, right = 0, ascent = 0, descent = 0;
    for (const { record, text: runText } of this.getRuns(text)) {
      const metrics = this.getRunMetrics(record, runText);
      left = Math.min(left, advance + metrics.left);
      right = Math.max(right, advance + metrics.right);
      ascent = Math.max(ascent, metrics.ascent);
      descent = Math.max(descent, metrics.descent);
      advance += metrics.advance;
    }
    return {
      width: (Math.max(advance, right) - left) * size,
      left: left * size, ascent: ascent * size, descent: descent * size,
    };
  }
}
