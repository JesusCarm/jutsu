import type { PdfTemplateDefinition, Typography, PdfField } from './pdf-types';
export class PdfTemplateConfig {
  readonly id: string;
  readonly pdf: string;
  readonly pages: PdfTemplateDefinition['pages'];
  readonly typography: Typography;
  readonly fields: PdfField[];
  readonly sourceUrl: string | null;

  constructor(definition: PdfTemplateDefinition, sourceUrl: string | URL | null = null) {
    const data = structuredClone(definition);
    this.id = data.id;
    this.pdf = data.pdf;
    this.pages = data.pages;
    this.typography = data.typography;
    this.fields = data.fields;
    this.sourceUrl = sourceUrl?.toString() ?? null;
    this.validate();
  }

  validateNumber(value: unknown, label: string, positive = false) {
    if (value === null) return;
    if (typeof value !== 'number' || !Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
      throw new TypeError(`${label} must be ${positive ? 'positive' : 'non-negative'} or null.`);
    }
  }

  validateTypography(style: Partial<Typography>, partial = false) {
    if (!style || typeof style !== 'object' || Array.isArray(style)) {
      throw new TypeError('Typography must be an object.');
    }
    if (!partial || style.font !== undefined) {
      if (style.font !== null && (typeof style.font !== 'string' || !style.font.trim())) {
        throw new TypeError('Font must be a non-empty name or null.');
      }
    }
    if (!partial || style.fontSize !== undefined) this.validateNumber(style.fontSize, 'Font size', true);
    if (!partial || style.lineHeight !== undefined) this.validateNumber(style.lineHeight, 'Line height', true);
    if ((!partial || style.fontSizeUnit !== undefined) && !['pt', 'px'].includes(style.fontSizeUnit ?? '')) {
      throw new TypeError('Font size unit must be pt or px.');
    }
    if ((!partial || style.alignment !== undefined) && !['left', 'center', 'right'].includes(style.alignment ?? '')) {
      throw new TypeError('Text alignment must be left, center or right.');
    }
    if ((!partial || style.color !== undefined) && !/^#[0-9a-f]{6}$/i.test(style.color ?? '')) {
      throw new TypeError('Text color must use #RRGGBB notation.');
    }
    if (style.minFontSize !== undefined) this.validateNumber(style.minFontSize, 'Minimum font size', true);
    if (style.verticalAlignment !== undefined && !['top', 'middle', 'bottom'].includes(style.verticalAlignment)) {
      throw new TypeError('Vertical alignment must be top, middle or bottom.');
    }
    if (style.fallbackFonts !== undefined && (!Array.isArray(style.fallbackFonts)
      || style.fallbackFonts.some((font) => typeof font !== 'string' || !font.trim()))) {
      throw new TypeError('Fallback fonts must be an array of font names.');
    }
  }

  validate() {
    if (typeof this.id !== 'string' || !this.id.trim()) throw new TypeError('A template ID is required.');
    if (typeof this.pdf !== 'string' || !this.pdf.trim()) throw new TypeError('A PDF path is required.');
    if (!Array.isArray(this.pages) || this.pages.length === 0) throw new TypeError('Declare the template pages.');
    const pageIndexes = new Set();
    for (const page of this.pages) {
      if (!Number.isInteger(page.index) || page.index < 0 || pageIndexes.has(page.index)) {
        throw new TypeError('Page indexes must be unique non-negative integers.');
      }
      pageIndexes.add(page.index);
      const reference = page.reference;
      if (!reference || !['px', 'pt'].includes(reference.unit) || reference.origin !== 'top-left') {
        throw new TypeError('Each page must declare a px or pt reference with a top-left origin.');
      }
      this.validateNumber(reference.width, 'Affinity page width', true);
      this.validateNumber(reference.height, 'Affinity page height', true);
    }
    this.validateTypography(this.typography);
    if (!Array.isArray(this.fields) || this.fields.length === 0) throw new TypeError('Declare the template fields.');
    const fieldIds = new Set();
    for (const field of this.fields) {
      if (typeof field.id !== 'string' || !/^[a-zA-Z_$][\w$]*(?:\.(?:[a-zA-Z_$][\w$]*|\d+))*$/.test(field.id)
        || fieldIds.has(field.id)) {
        throw new TypeError('Field IDs must be unique data paths in dot notation.');
      }
      fieldIds.add(field.id);
      if (field.enabled !== undefined && typeof field.enabled !== 'boolean') throw new TypeError('Field enabled must be boolean.');
      if (field.sources !== undefined && (field.type !== 'list' || !Array.isArray(field.sources)
        || field.sources.length === 0 || field.sources.some((path) => typeof path !== 'string'
          || !/^[a-zA-Z_$][\w$]*(?:\.(?:[a-zA-Z_$][\w$]*|\d+))*$/.test(path)))) {
        throw new TypeError(`Invalid list sources for ${field.id}.`);
      }
      if (!pageIndexes.has(field.page)) throw new TypeError(`Unknown page for ${field.id}.`);
      if (!['text', 'number', 'boolean', 'list'].includes(field.type)) {
        throw new TypeError(`Unknown value type for ${field.id}.`);
      }
      if (!field.box || typeof field.box !== 'object') throw new TypeError(`Declare the box for ${field.id}.`);
      for (const coordinate of (['x', 'y', 'width', 'height'] as const)) {
        this.validateNumber(field.box[coordinate], `${field.id}: ${coordinate}`, ['width', 'height'].includes(coordinate));
      }
      if (field.typography !== undefined) this.validateTypography(field.typography, true);
      const style = { ...this.typography, ...field.typography };
      if (style.fontSize !== null && style.minFontSize != null && style.minFontSize > style.fontSize) {
        throw new TypeError('Minimum font size cannot exceed font size.');
      }
      const reference = this.getPageReference(field.page);
      if (style.fontSizeUnit === 'px' && reference.unit !== 'px') {
        throw new TypeError('Pixel font sizes require a pixel reference on the same page.');
      }
    }
  }

  resolvePdfUrl(baseUrl = this.sourceUrl) {
    if (!baseUrl) throw new TypeError('Provide the configuration URL to resolve the PDF path.');
    return new URL(this.pdf, baseUrl).href;
  }

  getPageReference(index: number) {
    const page = this.pages.find((entry) => entry.index === index);
    if (!page) throw new RangeError(`Unknown template page: ${index}.`);
    return page.reference;
  }

  getField(id: string) {
    const field = this.fields.find((entry) => entry.id === id);
    if (!field) throw new RangeError(`Unknown template field: ${id}.`);
    return field;
  }

  getTypography(id: string) {
    return { ...this.typography, ...this.getField(id).typography };
  }

  getPendingPages() {
    return this.pages.filter(({ reference }) => reference.width === null || reference.height === null)
      .map((page) => page.index);
  }

  getPendingFields() {
    return this.getActiveFields().filter((field) => {
      const typography = this.getTypography(field.id);
      return (['x', 'y', 'width', 'height'] as const).some((key) => field.box[key] === null)
        || typography.font === null || typography.fontSize === null;
    }).map((field) => field.id);
  }

  getActiveFields() {
    return this.fields.filter((field) => field.enabled !== false);
  }

  isReady() {
    this.validate();
    return this.getActiveFields().length > 0 && this.getPendingPages().length === 0 && this.getPendingFields().length === 0;
  }

  assertReady() {
    if (!this.isReady()) {
      throw new Error('Complete the Affinity page dimensions, field boxes and typography before using this template.');
    }
  }
}
