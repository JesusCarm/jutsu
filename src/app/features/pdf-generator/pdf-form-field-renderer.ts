import type { PDFForm, PDFTextField, PDFOperator } from 'pdf-lib';
import {
  PDFDict, PDFName, PDFBool, TextAlignment, componentsToColor, degrees, drawRectangle, drawText,
  beginMarkedContent, endMarkedContent, pushGraphicsState, popGraphicsState, rectangle, clip, endPath, rgb,
} from 'pdf-lib';
import type { PdfFontFamily } from './pdf-font-family';
import type { PdfFormField } from './pdf-types';
import { PdfTextLayout } from './pdf-text-layout';

export class PdfFormFieldRenderer {
  constructor(readonly layout = new PdfTextLayout()) {}

  fill(form: PDFForm, field: PDFTextField, text: string, definition: PdfFormField, family: PdfFontFamily,
    { showBox = true } = {}): void {
    const value = definition.multiline ? text : text.replace(/\n/g, ' ');
    field.setText(value);
    if (definition.multiline) field.enableMultiline(); else field.disableMultiline();
    field.disableScrolling();
    field.setAlignment(definition.typography.alignment === 'center' ? TextAlignment.Center
      : definition.typography.alignment === 'right' ? TextAlignment.Right : TextAlignment.Left);
    const context = field.acroField.dict.context;
    const aliases = family.fonts.map((record) => `JutsuFont${record.font.ref.objectNumber}`);
    const resources = Object.fromEntries(family.fonts.map((record, index) => [aliases[index], record.font.ref]));
    const dr = form.acroForm.dict.lookupMaybe(PDFName.of('DR'), PDFDict) ?? context.obj({});
    const drFonts = dr.lookupMaybe(PDFName.of('Font'), PDFDict) ?? context.obj({});
    for (const [name, ref] of Object.entries(resources)) drFonts.set(PDFName.of(name), ref);
    dr.set(PDFName.of('Font'), drFonts);
    form.acroForm.dict.set(PDFName.of('DR'), dr);
    form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.False);
    const channels = [1, 3, 5].map((index) => parseInt(definition.typography.color.slice(index, index + 2), 16) / 255);
    const color = rgb(channels[0], channels[1], channels[2]);
    let minimumSize = definition.typography.fontSize;
    for (const widget of field.acroField.getWidgets()) {
      // Child widgets inherit the canonical value; remove stale local copies.
      if (widget.dict !== field.acroField.dict) widget.dict.delete(PDFName.of('V'));
      const { width, height } = widget.getRectangle();
      const appearance = widget.getAppearanceCharacteristics();
      if ((appearance?.getRotation() ?? 0) % 360 !== 0) throw new Error('Rotated form widgets are not supported.');
      const border = widget.getBorderStyle()?.getWidth() ?? 0;
      const padding = border + 2;
      if (width <= 2 * padding || height <= 2 * padding) throw new Error('The form field is too small for text.');
      const box = { x: padding, y: padding, width: width - 2 * padding, height: height - 2 * padding };
      const fitted = value ? this.layout.fit(value, family, box, definition.typography, { multiline: definition.multiline }) : null;
      const size = fitted?.fontSize ?? definition.typography.fontSize;
      minimumSize = Math.min(minimumSize, size);
      const operators: PDFOperator[] = showBox ? drawRectangle({
        x: border / 2, y: border / 2, width: width - border, height: height - border, borderWidth: border,
        borderColor: border ? componentsToColor(appearance?.getBorderColor()) : undefined,
        color: componentsToColor(appearance?.getBackgroundColor()),
        rotate: degrees(0), xSkew: degrees(0), ySkew: degrees(0),
      }) : [];
      operators.push(beginMarkedContent('Tx'), pushGraphicsState(), rectangle(0, 0, width, height), clip(), endPath());
      for (const line of fitted?.lines ?? []) {
        let x = line.x;
        for (const run of family.getRuns(line.text)) {
          const index = family.fonts.indexOf(run.record);
          operators.push(...drawText(run.record.font.encodeText(run.text), {
            x, y: line.y, size, font: aliases[index], color, rotate: degrees(0), xSkew: degrees(0), ySkew: degrees(0),
          }));
          x += family.getRunMetrics(run.record, run.text).advance * size;
        }
      }
      operators.push(popGraphicsState(), endMarkedContent());
      const stream = context.formXObject(operators, {
        Resources: { Font: resources }, BBox: [0, 0, width, height], Matrix: [1, 0, 0, 1, 0, 0],
      });
      widget.setNormalAppearance(context.register(stream));
      widget.removeRolloverAppearance();
      widget.removeDownAppearance();
      widget.setDefaultAppearance(`/${aliases[0]} ${size} Tf\n${channels.join(' ')} rg`);
    }
    field.acroField.setDefaultAppearance(`/${aliases[0]} ${minimumSize} Tf\n${channels.join(' ')} rg`);
    form.markFieldAsClean(field.ref);
  }
}
