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

async function setup(generate: GenerateBandPdf = async () => new Uint8Array([37, 80, 68, 70])) {
  const files = { download: vi.fn(), openForPrinting: vi.fn() };
  TestBed.configureTestingModule({ providers: [
    ...provideTestI18n(),
    { provide: GENERATE_BAND_PDF, useValue: generate },
    { provide: PdfBrowserFilesService, useValue: files },
  ] });
  await TestBed.inject(I18nService).initialize();
  return { files, exports: TestBed.inject(PdfExportService), pdf: TestBed.inject(PdfGenerationService), state: TestBed.inject(BandStateService) };
}

describe('PDF export actions', () => {
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
