import type { PageReference, DraftBox } from './pdf-types';
export class AffinityCoordinateConverter {
  referenceWidth: number;
  referenceHeight: number;
  pdfWidth: number;
  pdfHeight: number;
  pdfX: number;
  pdfY: number;
  scaleX: number;
  scaleY: number;

  constructor(reference: PageReference, pdfPageBox: { width: number; height: number; x?: number; y?: number }) {
    if (!['px', 'pt'].includes(reference.unit) || reference.origin !== 'top-left') {
      throw new TypeError('Affinity coordinates must use px or pt and a top-left origin.');
    }
    this.validateNumber(reference.width, 'Reference width', true);
    this.validateNumber(reference.height, 'Reference height', true);
    this.validateNumber(pdfPageBox.width, 'PDF width', true);
    this.validateNumber(pdfPageBox.height, 'PDF height', true);

    this.referenceWidth = reference.width;
    this.referenceHeight = reference.height;
    this.pdfWidth = pdfPageBox.width;
    this.pdfHeight = pdfPageBox.height;
    this.pdfX = pdfPageBox.x ?? 0;
    this.pdfY = pdfPageBox.y ?? 0;
    if (!Number.isFinite(this.pdfX) || !Number.isFinite(this.pdfY)) {
      throw new TypeError('PDF page origin must contain finite numbers.');
    }
    this.scaleX = this.pdfWidth / this.referenceWidth;
    this.scaleY = this.pdfHeight / this.referenceHeight;
  }

  validateNumber(value: unknown, label: string, positive = false): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
      throw new TypeError(`${label} must be a ${positive ? 'positive' : 'non-negative'} number.`);
    }
  }

  toPdfLength(value: number, axis: 'x' | 'y' = 'y') {
    this.validateNumber(value, 'Length');
    if (axis !== 'x' && axis !== 'y') throw new TypeError('Choose the x or y axis.');
    return value * (axis === 'x' ? this.scaleX : this.scaleY);
  }

  toPdfPoint({ x, y }: { x: number; y: number }) {
    this.validateNumber(x, 'X coordinate');
    this.validateNumber(y, 'Y coordinate');
    if (x > this.referenceWidth || y > this.referenceHeight) {
      throw new RangeError('The point is outside the Affinity page.');
    }
    return {
      x: this.pdfX + this.toPdfLength(x, 'x'),
      y: this.pdfY + this.pdfHeight - this.toPdfLength(y, 'y'),
    };
  }

  toPdfBox({ x, y, width, height }: DraftBox) {
    this.validateNumber(width, 'Box width', true);
    this.validateNumber(height, 'Box height', true);
    this.validateNumber(x, 'X coordinate');
    this.validateNumber(y, 'Y coordinate');
    const topLeft = this.toPdfPoint({ x, y });
    if (x + width > this.referenceWidth + 1e-9 || y + height > this.referenceHeight + 1e-9) {
      throw new RangeError('The box is outside the Affinity page.');
    }
    const pdfHeight = this.toPdfLength(height, 'y');
    return {
      x: topLeft.x,
      y: topLeft.y - pdfHeight,
      width: this.toPdfLength(width, 'x'),
      height: pdfHeight,
    };
  }
}
