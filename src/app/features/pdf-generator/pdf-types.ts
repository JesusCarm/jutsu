import type { PDFFont, PDFRef } from 'pdf-lib';
import type { Font } from '@pdf-lib/fontkit';
export type FetchResource = (url: string) => Promise<Response>;
export interface PdfBox { x: number; y: number; width: number; height: number; }
export interface DraftBox { x: number | null; y: number | null; width: number | null; height: number | null; }
export interface PageReference { width: number | null; height: number | null; unit: 'px' | 'pt'; origin: 'top-left'; }
export interface Typography {
  font: string | null; fontSize: number | null; fontSizeUnit: 'px' | 'pt';
  lineHeight: number | null; alignment: 'left' | 'center' | 'right'; color: string;
  minFontSize?: number | null; fallbackFonts?: string[]; verticalAlignment?: 'top' | 'middle' | 'bottom';
}
export type ReadyTypography = Typography & { font: string; fontSize: number };
export type FieldType = 'text' | 'number' | 'boolean' | 'list';
export interface PdfField { id: string; page: number; type: FieldType; box: DraftBox; enabled?: boolean; sources?: string[]; typography?: Partial<Typography>; }
export interface PdfTemplateDefinition { id: string; pdf: string; pages: { index: number; reference: PageReference }[]; typography: Typography; fields: PdfField[]; }
export type FormValueType = FieldType | 'technique';
export type PdfInlineIconName = 'mokushin';
export interface PdfInlineIcon { ref: PDFRef; width: number; height: number; }
export interface PdfFormField {
  name: string; sources: readonly string[]; type: FormValueType; multiline: boolean; typography: ReadyTypography;
}
export interface PdfFormIcon { name: string; source: string; icon: PdfInlineIconName; }
export interface PdfRepeatedSheet { count: number; pageSize: readonly [number, number]; }
export interface PdfTemplate {
  configUrl: string; pdfUrl?: string; fontUrls: Record<string, string>;
  formFields?: readonly PdfFormField[]; formOutput?: 'editable' | 'flattened';
  iconUrls?: Partial<Record<PdfInlineIconName, string>>;
  formIcons?: readonly PdfFormIcon[]; repeatedSheet?: PdfRepeatedSheet;
}
export interface FontRecord { font: PDFFont; raw: Font | null; characters: Set<number>; }
export interface FontRun { record: FontRecord; text: string; }
export interface RunMetrics { advance: number; left: number; right: number; ascent: number; descent: number; }
export interface TextMetrics { width: number; left: number; ascent: number; descent: number; }
export interface PdfTextMeasurer { getTextMetrics(text: string, size: number): TextMetrics; }
