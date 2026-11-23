import {
  PDFContext, PDFOperator, PDFOperatorNames, concatTransformationMatrix, drawSvgPath,
  pushGraphicsState, popGraphicsState, rgb,
} from 'pdf-lib';
import type { PdfInlineIcon } from './pdf-types';

/** Embeds the monochrome paths and matrix groups exported by Affinity. */
export class PdfSvgIcon {
  constructor(readonly context: PDFContext) {}

  embed(svg: string): PdfInlineIcon {
    const operators: PDFOperator[] = [];
    const stack: string[] = [];
    const fillRules: boolean[] = [];
    let dimensions: number[] | undefined;
    const tokens = svg.match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<[^>]+>/g) ?? [];
    for (const token of tokens) {
      if (/^<[!?]/.test(token)) continue;
      const tag = token.match(/^<(\/)?([\w:-]+)/);
      if (!tag) throw new Error('Invalid SVG icon markup.');
      const [, closing, name] = tag;
      if (closing) {
        if (stack.pop() !== name) throw new Error('Unbalanced SVG icon groups.');
        fillRules.pop();
        operators.push(popGraphicsState());
        continue;
      }
      const attributes = Object.fromEntries([...token.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)]
        .map((match) => [match[1], match[3]]));
      const rule = attributes['fill-rule'] ?? attributes['style']?.match(/(?:^|;)\s*fill-rule\s*:\s*(\w+)/)?.[1];
      const evenOdd = rule ? rule === 'evenodd' : fillRules.at(-1) ?? false;
      if (name === 'svg') {
        if (dimensions) throw new Error('Nested SVG icons are not supported.');
        dimensions = this.numbers(attributes['viewBox'], 4);
        const [x, y, width, height] = dimensions;
        if (width <= 0 || height <= 0) throw new Error('Invalid SVG icon dimensions.');
        operators.push(pushGraphicsState(), concatTransformationMatrix(1, 0, 0, -1, -x, y + height));
      } else if (name === 'g') {
        operators.push(pushGraphicsState());
      } else if (name === 'rect' && /(?:^|;)\s*fill\s*:\s*none\s*(?:;|$)/.test(attributes['style'] ?? '')) {
        // Affinity includes a transparent rectangle to define the icon canvas.
        continue;
      } else if (name === 'path' && attributes['d']) {
        operators.push(pushGraphicsState());
      } else {
        throw new Error(`Unsupported SVG icon element: ${name}`);
      }
      const transform = attributes['transform'];
      if (transform) {
        const matrix = transform.match(/^matrix\(([^)]+)\)$/);
        if (!matrix) throw new Error('SVG icons require matrix transforms.');
        const [a, b, c, d, e, f] = this.numbers(matrix[1], 6);
        operators.push(concatTransformationMatrix(a, b, c, d, e, f));
      }
      if (name === 'path') {
        // drawSvgPath flips Y itself; cancel that flip inside the SVG coordinate system.
        const path = drawSvgPath(attributes['d'], { x: 0, y: 0, scale: 1, color: rgb(0, 0, 0), borderColor: undefined, borderWidth: 0 });
        operators.push(concatTransformationMatrix(1, 0, 0, -1, 0, 0),
          ...path.map((operator) => evenOdd && operator.toString() === 'f'
            ? PDFOperator.of(PDFOperatorNames.FillEvenOdd) : operator));
      }
      if (token.endsWith('/>')) operators.push(popGraphicsState());
      else { stack.push(name); fillRules.push(evenOdd); }
    }
    if (!dimensions || stack.length) throw new Error('Invalid SVG icon document.');
    const [, , width, height] = dimensions;
    // Inline drawing uses a unit square, just like a PDF image XObject.
    const stream = this.context.formXObject(operators, {
      BBox: [0, 0, width, height], Matrix: [1 / width, 0, 0, 1 / height, 0, 0], Resources: {},
    });
    return { ref: this.context.register(stream), width, height };
  }

  private numbers(value: string | undefined, length: number): number[] {
    const numbers = value?.trim().split(/[\s,]+/).map(Number) ?? [];
    if (numbers.length !== length || !numbers.every(Number.isFinite)) throw new Error('Invalid SVG icon coordinates.');
    return numbers;
  }
}
