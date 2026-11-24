import { I18nService } from '../../core/i18n/i18n.service';
import { provideTestI18n } from '../../../../tests/fixtures/i18n-testing';
import { GameTextService } from '../../core/i18n/game-text.service';
import { Labels } from '../../core/i18n/i18n-keys';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { BandStateService } from '../character-sheet/band-state.service';
import { PdfBrowserFilesService } from './pdf-browser-files.service';
import { PdfExportService } from './pdf-export.service';
import { GENERATE_BAND_PDF, PdfGenerationService } from './pdf-generation.service';
import type { GenerateBandPdf } from './pdf-generation.service';
import { TranslationError } from '../../core/i18n/translation-error';
import { Messages } from '../../core/i18n/i18n-keys';

async function setup(generate: GenerateBandPdf = async () => new Uint8Array([37, 80, 68, 70])) {
  const viewer = { show: vi.fn(), close: vi.fn() };
  const files = { download: vi.fn(), openForPrinting: vi.fn(), prepareForPrinting: vi.fn(() => viewer) };
  TestBed.configureTestingModule({ providers: [
    ...provideTestI18n(),
    { provide: GENERATE_BAND_PDF, useValue: generate },
    { provide: PdfBrowserFilesService, useValue: files },
  ] });
  await TestBed.inject(I18nService).initialize();
  return { files, viewer, exports: TestBed.inject(PdfExportService), pdf: TestBed.inject(PdfGenerationService), state: TestBed.inject(BandStateService) };
}

describe('PDF export actions', () => {
  it('reserves the print tab synchronously, generates once and opens the result without downloading', async () => {
    let release!: (bytes: Uint8Array) => void;
    const generate = vi.fn<GenerateBandPdf>(() => new Promise((resolve) => { release = resolve; }));
    const { exports, files, viewer } = await setup(generate);
    const pending = exports.generateAndOpenForPrinting();
    expect(files.prepareForPrinting).toHaveBeenCalledExactlyOnceWith('Generating your sheet…');
    expect(files.prepareForPrinting.mock.invocationCallOrder[0]).toBeLessThan(generate.mock.invocationCallOrder[0]);
    expect(viewer.show).not.toHaveBeenCalled();
    await exports.generateAndOpenForPrinting();
    expect(generate).toHaveBeenCalledTimes(1);
    release(new Uint8Array([1, 2])); await pending;
    expect(viewer.show).toHaveBeenCalledExactlyOnceWith(new Uint8Array([1, 2]));
    expect(viewer.close).not.toHaveBeenCalled();
    expect(files.download).not.toHaveBeenCalled();
    expect(exports.status().message).toContain('print controls');
  });

  it.each(['error', 'edit', 'language'])('closes the reserved tab after a generation becomes unusable: %s', async (cause) => {
    let release!: (bytes: Uint8Array) => void;
    let fail!: (reason: Error) => void;
    const { exports, viewer, state } = await setup(() => new Promise((resolve, reject) => { release = resolve; fail = reject; }));
    const pending = exports.generateAndOpenForPrinting();
    if (cause === 'edit') state.setName(0, 'Changed');
    if (cause === 'language') await TestBed.inject(I18nService).setLanguage('es');
    if (cause === 'error') fail(new Error('Missing template')); else release(new Uint8Array([1]));
    await pending;
    expect(viewer.show).not.toHaveBeenCalled();
    expect(viewer.close).toHaveBeenCalledTimes(1);
    if (cause === 'error') expect(exports.status().message).toContain('Missing template');
  });

  it('reports blocked print tabs and closed viewers and allows retrying', async () => {
    const generate = vi.fn<GenerateBandPdf>().mockResolvedValue(new Uint8Array([1]));
    const { exports, files, viewer } = await setup(generate);
    files.prepareForPrinting.mockImplementationOnce(() => { throw new TranslationError(Messages.popupBlocked); });
    await exports.generateAndOpenForPrinting();
    expect(generate).not.toHaveBeenCalled();
    expect(exports.status().message).toContain('Allow pop-ups');
    viewer.show.mockImplementationOnce(() => { throw new TranslationError(Messages.printWindowClosed); });
    await exports.generateAndOpenForPrinting();
    expect(viewer.close).toHaveBeenCalledTimes(1);
    expect(exports.status().message).toContain('was closed');
    await exports.generateAndOpenForPrinting();
    expect(viewer.show).toHaveBeenCalledTimes(2);
    expect(exports.status().phase).toBe('success');
  });

  it('waits for generation and downloads exactly once when a repeated click occurs while loading', async () => {
    let release!: (bytes: Uint8Array) => void;
    const generate = vi.fn<GenerateBandPdf>(() => new Promise((resolve) => { release = resolve; }));
    const { files, exports, state } = await setup(generate);
    state.setBandName('The Ravens');
    const pending = exports.generateAndDownload();
    await exports.generateAndDownload();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(files.download).not.toHaveBeenCalled();
    release(new Uint8Array([37, 80, 68, 70]));
    await pending;
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'jutsu-squad-The-Ravens.pdf');
    expect(exports.status().message).toBe('Download started.');
  });

  it('keeps generation errors visible without attempting a download', async () => {
    const { files, exports } = await setup(async () => { throw new Error('Missing template'); });
    await exports.generateAndDownload();
    expect(files.download).not.toHaveBeenCalled();
    expect(exports.status().phase).toBe('error');
    expect(exports.status().message).toContain('Missing template');
  });

  it('does not download a sheet that became obsolete during generation', async () => {
    let release!: (bytes: Uint8Array) => void;
    const { files, exports, state } = await setup(() => new Promise((resolve) => { release = resolve; }));
    const pending = exports.generateAndDownload();
    state.setBandName('Edited while loading');
    release(new Uint8Array([37, 80, 68, 70]));
    await pending;
    expect(files.download).not.toHaveBeenCalled();
    expect(exports.status().message).toContain('Your squad, language or template changed');
  });

  it('requires a current PDF and sends a copy of its bytes to each browser action', async () => {
    const { files, exports, pdf, state } = await setup();
    exports.download();
    exports.openForPrinting();
    expect(files.download).not.toHaveBeenCalled();
    expect(files.openForPrinting).not.toHaveBeenCalled();
    expect(exports.status().phase).toBe('error');
    state.setBandName('Café Ninjas');
    await pdf.generate();
    exports.download();
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'jutsu-squad-Café-Ninjas.pdf');
    files.download.mock.calls[0][0][0] = 0;
    exports.openForPrinting();
    expect(files.openForPrinting).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]));
    expect(exports.status().message).toContain('print controls');
    state.setBandName('Ravens');
    expect(exports.status().message).toBe('Ready to generate your sheet.');
    exports.download();
    expect(files.download).toHaveBeenCalledTimes(1);
  });

  it('shows browser errors and allows retrying without regenerating a valid PDF', async () => {
    const { files, exports, pdf } = await setup();
    await pdf.generate();
    files.openForPrinting.mockImplementationOnce(() => { throw new Error('Allow pop-ups for this site.'); });
    exports.openForPrinting();
    expect(exports.status()).toEqual({ phase: 'error', message: 'Could not export the PDF. Allow pop-ups for this site.' });
    expect(pdf.hasPdf()).toBe(true);
    exports.download();
    expect(files.download.mock.calls[0][1]).toBe('jutsu-squad.pdf');
    expect(exports.status().message).toBe('Download started.');
  });
});
