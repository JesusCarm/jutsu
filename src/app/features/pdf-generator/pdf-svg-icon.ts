import {
  PDFContext, PDFOperator, PDFOperatorNames, concatTransformationMatrix, drawSvgPath,
  pushGraphicsState, popGraphicsState, rgb, drawImage, degrees, PDFName, type PDFImage,
} from 'pdf-lib';
import type { PdfInlineIcon } from './pdf-types';

/** Embeds the monochrome paths, matrix groups, and local PNG details exported by Affinity. */
export class PdfSvgIcon {
  constructor(readonly context: PDFContext, readonly embedPng: (source: string) => Promise<PDFImage>) {}

  async embed(svg: string): Promise<PdfInlineIcon> {
    const operators: PDFOperator[] = [];
    const imageSources = new Map<string, string>();
    const images = new Map<string, PDFImage>();
    const resources = this.context.obj({});
    for (const token of svg.match(/<image\b[^>]*>/g) ?? []) {
      const attributes = this.attributes(token);
      if (attributes['id']) imageSources.set(attributes['id'], attributes['href'] ?? attributes['xlink:href']);
    }
    const stack: string[] = [];
    const fillRules: boolean[] = [];
    let dimensions: number[] | undefined;
    const tokens = svg.replace(/<defs\b[^>]*>[\s\S]*?<\/defs>/g, '')
      .match(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<[^>]+>/g) ?? [];
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
      const attributes = this.attributes(token);
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
      } else if ((name === 'path' && attributes['d']) || name === 'use') {
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
        const style = attributes['style'] ?? '';
        const stroke = attributes['stroke'] ?? style.match(/(?:^|;)\s*stroke\s*:\s*([^;]+)/)?.[1];
        const strokeWidth = parseFloat(attributes['stroke-width'] ?? style.match(/(?:^|;)\s*stroke-width\s*:\s*([^;]+)/)?.[1] ?? '1');
        const fill = attributes['fill'] ?? style.match(/(?:^|;)\s*fill\s*:\s*([^;]+)/)?.[1];
        const path = drawSvgPath(attributes['d'], { x: 0, y: 0, scale: 1,
          color: fill === 'none' ? undefined : rgb(0, 0, 0),
          borderColor: stroke && stroke !== 'none' ? rgb(0, 0, 0) : undefined,
          borderWidth: stroke && stroke !== 'none' ? strokeWidth : 0 });
        operators.push(concatTransformationMatrix(1, 0, 0, -1, 0, 0),
          ...path.map((operator) => evenOdd && operator.toString() === 'f'
            ? PDFOperator.of(PDFOperatorNames.FillEvenOdd) : operator));
      } else if (name === 'use') {
        const href = attributes['href'] ?? attributes['xlink:href'];
        const source = href?.startsWith('#') ? imageSources.get(href.slice(1)) : undefined;
        if (!source?.startsWith('data:image/png;base64,')) throw new Error('SVG image references require an embedded PNG.');
        let image = images.get(href);
        if (!image) {
          image = await this.embedPng(source);
          images.set(href, image);
        }
        const resource = PDFName.of(`SvgImage${[...images.keys()].indexOf(href) + 1}`);
        resources.set(resource, image.ref);
        const [x, y, width, height] = ['x', 'y', 'width', 'height'].map((key) => parseFloat(attributes[key] ?? '0'));
        if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('Invalid SVG image dimensions.');
        operators.push(concatTransformationMatrix(1, 0, 0, -1, 0, 0), ...drawImage(resource, {
          x, y: -y - height, width, height, rotate: degrees(0), xSkew: degrees(0), ySkew: degrees(0),
        }));
      }
      if (token.endsWith('/>')) operators.push(popGraphicsState());
      else { stack.push(name); fillRules.push(evenOdd); }
    }
    if (!dimensions || stack.length) throw new Error('Invalid SVG icon document.');
    const [, , width, height] = dimensions;
    // Inline drawing uses a unit square, just like a PDF image XObject.
    const stream = this.context.formXObject(operators, {
      BBox: [0, 0, width, height], Matrix: [1 / width, 0, 0, 1 / height, 0, 0], Resources: { XObject: resources },
    });
    return { ref: this.context.register(stream), width, height };
  }

  private attributes(token: string): Record<string, string> {
    return Object.fromEntries([...token.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)]
      .map((match) => [match[1], match[3]]));
  }

  private numbers(value: string | undefined, length: number): number[] {
    const numbers = value?.trim().split(/[\s,]+/).map(Number) ?? [];
    if (numbers.length !== length || !numbers.every(Number.isFinite)) throw new Error('Invalid SVG icon coordinates.');
    return numbers;
  }
}
