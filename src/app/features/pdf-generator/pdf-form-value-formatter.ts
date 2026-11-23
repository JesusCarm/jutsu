import type { FormValueType } from './pdf-types';
import { PdfFieldFormatter } from './pdf-field-formatter';

export class PdfFormValueFormatter {
  constructor(readonly scalar = new PdfFieldFormatter()) {}

  format(value: unknown, type: FormValueType): string {
    if (type !== 'technique') return this.scalar.format(value, type);
    if (value == null) return '';
    if (typeof value !== 'object' || !('name' in value) || typeof value.name !== 'string'
      || !('description' in value) || typeof value.description !== 'string'
      || !('chakra' in value) || !['number', 'string'].includes(typeof value.chakra)
      || typeof value.chakra === 'number' && !Number.isFinite(value.chakra)
      || !('isMokushin' in value) || typeof value.isMokushin !== 'boolean') {
      throw new TypeError('A technique requires a name, description, chakra cost and Mokushin flag.');
    }
    return this.scalar.format(`${value.name}\n${value.description}`, 'text');
  }
}
