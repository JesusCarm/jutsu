import type { FieldType } from './pdf-types';
export class PdfFieldFormatter {
  format(value: unknown, type: FieldType) {
    if (value == null) return '';
    if (type === 'list') {
      if (!Array.isArray(value)) throw new TypeError('A list field requires an array.');
      return value.map((entry) => typeof entry === 'string' ? entry : entry && typeof entry === 'object' && 'name' in entry ? entry.name : '')
        .filter((name) => name !== '').join(', ');
    }
    if (type === 'boolean') {
      if (typeof value !== 'boolean') throw new TypeError('A boolean field requires a boolean.');
      return value ? 'Mokushin' : '';
    }
    if (type === 'number' && !Number.isFinite(value)) throw new TypeError('A number field requires a finite number.');
    if (!['number', 'text'].includes(type) || !['number', 'string'].includes(typeof value)) {
      throw new TypeError(`Unsupported value for a ${type} field.`);
    }
    return String(value).replace(/\r\n?/g, '\n').replace(/\t/g, ' ');
  }
}
