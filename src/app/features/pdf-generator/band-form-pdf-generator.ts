import { PDFDict, PDFName, PDFTextField } from 'pdf-lib';
import type { FetchResource, PdfTemplate } from './pdf-types';
import { BandFieldResolver } from './band-field-resolver';
import { PdfFontProvider } from './pdf-font-provider';
import { PdfTemplateLoader } from './pdf-template-loader';
import { PdfFormValueFormatter } from './pdf-form-value-formatter';
import { PdfFormFieldRenderer } from './pdf-form-field-renderer';
import { PdfIconProvider } from './pdf-icon-provider';
import { PdfNoteMarkers } from './pdf-note-markers';
import { PdfNoteIconRenderer } from './pdf-note-icon-renderer';

export class BandFormPdfGenerator {
  constructor(readonly fetchResource: FetchResource = (url) => globalThis.fetch(url),
    readonly renderer = new PdfFormFieldRenderer(), readonly resolver = new BandFieldResolver(),
    readonly formatter = new PdfFormValueFormatter(), readonly markers = new PdfNoteMarkers(),
    readonly iconRenderer = new PdfNoteIconRenderer()) {}

  async generate(data: unknown, template: PdfTemplate): Promise<Uint8Array> {
    if (!template.pdfUrl || !template.formFields?.length) throw new Error('A form template requires a PDF URL and named fields.');
    const pdf = await new PdfTemplateLoader(this.fetchResource).load(template.pdfUrl);
    const form = pdf.getForm();
    const fields = new Map<string, PDFTextField>();
    const widgets = new Set<PDFDict>();
    const expected = new Set(template.formFields.map((field) => field.name));
    if (expected.size !== template.formFields.length) throw new Error('Duplicate names in the form field mapping.');
    for (const field of form.getFields()) {
      const name = field.getName();
      if (!expected.has(name)) continue;
      if (fields.has(name)) throw new Error(`Duplicate PDF form field: ${name}`);
      if (!(field instanceof PDFTextField)) throw new Error(`Expected a text field: ${name}`);
      if (!field.acroField.getWidgets().length) throw new Error(`Missing widget for PDF form field: ${name}`);
      fields.set(name, field);
      for (const widget of field.acroField.getWidgets()) {
        if (widget.dict !== field.acroField.dict && widget.dict.lookupMaybe(PDFName.of('Parent'), PDFDict) !== field.acroField.dict) {
          throw new Error(`The widget is not linked to its canonical field: ${name}`);
        }
        widgets.add(widget.dict);
      }
    }
    for (const name of expected) if (!fields.has(name)) throw new Error(`Missing PDF form field: ${name}`);
    const pageWidgets = new Set<PDFDict>();
    for (let index = 0; index < pdf.getPageCount(); index++) {
      const page = pdf.getPage(index);
      for (const ref of page.node.Annots()?.asArray() ?? []) {
        const dict = page.doc.context.lookup(ref);
        if (dict instanceof PDFDict && dict.get(PDFName.of('Subtype'))?.toString() === '/Widget') pageWidgets.add(dict);
      }
    }
    for (const widget of widgets) if (!pageWidgets.has(widget)) throw new Error('A mapped form widget is not attached to a PDF page.');
    for (const widget of pageWidgets) {
      if (!form.getFields().some((field) => field.acroField.getWidgets().some((candidate) => candidate.dict === widget))) {
        throw new Error('The PDF contains an orphaned form widget.');
      }
    }
    const flatten = template.formOutput === 'flattened';
    // Editable forms need complete fonts; static exports only need the used glyphs.
    const fonts = new PdfFontProvider(pdf, template.fontUrls, this.fetchResource, flatten);
    const icons = new PdfIconProvider(pdf, template.iconUrls ?? {}, this.fetchResource);
    const markers = this.markers.extract(pdf, template.formIcons ?? []);
    for (const definition of template.formFields) {
      try {
        const values = definition.sources.map((source) => this.resolver.resolve(data, source));
        const value = definition.type === 'list' ? values.flatMap((entry) => entry ?? []) : values[0];
        const text = this.formatter.format(value, definition.type);
        this.renderer.fill(form, fields.get(definition.name)!, text, definition, await fonts.getFamily(definition.typography),
          { showBox: !flatten });
      } catch (error) {
        throw new Error(`Unable to fill ${definition.name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }
    for (const definition of template.formIcons ?? []) {
      try {
        const visible = this.resolver.resolve(data, definition.source);
        if (visible != null && typeof visible !== 'boolean') throw new TypeError('An icon indicator must be a boolean.');
        if (visible) this.iconRenderer.render(markers.get(definition.name)!, await icons.get(definition.icon));
      } catch (error) {
        throw new Error(`Unable to render ${definition.name}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }
    if (flatten) pdf.flattenForm();
    return pdf.save();
  }
}
