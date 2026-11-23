import type { FetchResource, PdfTemplate, ReadyTypography } from './pdf-types';
import { AffinityCoordinateConverter } from './affinity-coordinate-converter';
import { BandFieldResolver } from './band-field-resolver';
import { PdfFieldFormatter } from './pdf-field-formatter';
import { PdfFieldRenderer } from './pdf-field-renderer';
import { PdfFontProvider } from './pdf-font-provider';
import { PdfTemplateConfigLoader } from './pdf-template-config-loader';
import { PdfTemplateLoader } from './pdf-template-loader';
import { BandFormPdfGenerator } from './band-form-pdf-generator';
import { BandSheetPdfGenerator } from './band-sheet-pdf-generator';

export class BandPdfGenerator {
  readonly fetchResource: FetchResource;
  readonly configLoader: PdfTemplateConfigLoader;
  readonly templateLoader: PdfTemplateLoader;
  readonly resolver: BandFieldResolver;
  readonly formatter: PdfFieldFormatter;
  renderer: PdfFieldRenderer;

  constructor({ fetchResource = (url) => globalThis.fetch(url) }: { fetchResource?: FetchResource } = {}) {
    this.fetchResource = fetchResource;
    this.configLoader = new PdfTemplateConfigLoader(fetchResource);
    this.templateLoader = new PdfTemplateLoader(fetchResource);
    this.resolver = new BandFieldResolver();
    this.formatter = new PdfFieldFormatter();
    this.renderer = new PdfFieldRenderer();
  }

  async generate(band: unknown, template: PdfTemplate): Promise<Uint8Array> {
    const data: unknown = JSON.parse(JSON.stringify(band));
    if (template.repeatedSheet) return new BandSheetPdfGenerator(this.fetchResource).generate(data, template);
    if (template.formFields) return new BandFormPdfGenerator(this.fetchResource).generate(data, template);
    const config = await this.configLoader.load(template.configUrl);
    config.assertReady();
    const pdf = await this.templateLoader.load(template.pdfUrl ?? config.resolvePdfUrl());
    const fonts = new PdfFontProvider(pdf, template.fontUrls, this.fetchResource);
    const converters = new Map<number, AffinityCoordinateConverter>();

    for (const field of config.getActiveFields()) {
      try {
        const value = field.sources
          ? field.sources.flatMap((path) => this.resolver.resolve(data, path) ?? [])
          : this.resolver.resolve(data, field.id);
        const text = this.formatter.format(value, field.type);
        if (!text) continue;
        if (!converters.has(field.page)) {
          converters.set(field.page, new AffinityCoordinateConverter(
            config.getPageReference(field.page), pdf.getPage(field.page).getMediaBox(),
          ));
        }
        const converter = converters.get(field.page)!;
        const box = converter.toPdfBox(field.box);
        const style = config.getTypography(field.id) as ReadyTypography;
        if (style.fontSizeUnit === 'px') {
          style.fontSize = converter.toPdfLength(style.fontSize, 'y');
          if (style.minFontSize != null) style.minFontSize = converter.toPdfLength(style.minFontSize, 'y');
          if (style.lineHeight != null) style.lineHeight = converter.toPdfLength(style.lineHeight, 'y');
        }
        this.renderer.render(pdf.getPage(field.page), text, box, style, await fonts.getFamily(style));
      } catch (error) {
        throw new Error(`Unable to render ${field.id}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
      }
    }
    return pdf.save();
  }
}
