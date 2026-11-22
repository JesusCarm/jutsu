import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { BandState } from '../character-sheet/band-state';
import { PdfBrowserFiles } from './pdf-browser-files';
import { PdfExport } from './pdf-export';
import { GENERATE_BAND_PDF, PdfGeneration } from './pdf-generation';
import type { GenerateBandPdf } from './pdf-generation';

function setup(generate: GenerateBandPdf = async () => new Uint8Array([37, 80, 68, 70])) {
  const files = { download: vi.fn(), openForPrinting: vi.fn() };
  TestBed.configureTestingModule({ providers: [
    { provide: GENERATE_BAND_PDF, useValue: generate },
    { provide: PdfBrowserFiles, useValue: files },
  ] });
  return { files, exports: TestBed.inject(PdfExport), pdf: TestBed.inject(PdfGeneration), state: TestBed.inject(BandState) };
}

describe('PDF export actions', () => {
  it('waits for generation and downloads exactly once when a repeated click occurs while loading', async () => {
    let release!: (bytes: Uint8Array) => void;
    const generate = vi.fn<GenerateBandPdf>(() => new Promise((resolve) => { release = resolve; }));
    const { files, exports, state } = setup(generate);
    state.setBandName('Los Cuervos');
    const pending = exports.generateAndDownload();
    await exports.generateAndDownload();
    expect(generate).toHaveBeenCalledTimes(1);
    expect(files.download).not.toHaveBeenCalled();
    release(new Uint8Array([37, 80, 68, 70]));
    await pending;
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'Los-Cuervos.pdf');
    expect(exports.status().message).toBe('Download started.');
  });

  it('keeps generation errors visible without attempting a download', async () => {
    const { files, exports } = setup(async () => { throw new Error('Missing template'); });
    await exports.generateAndDownload();
    expect(files.download).not.toHaveBeenCalled();
    expect(exports.status().phase).toBe('error');
    expect(exports.status().message).toContain('Missing template');
  });

  it('does not download a sheet that became obsolete during generation', async () => {
    let release!: (bytes: Uint8Array) => void;
    const { files, exports, state } = setup(() => new Promise((resolve) => { release = resolve; }));
    const pending = exports.generateAndDownload();
    state.setBandName('Edited while loading');
    release(new Uint8Array([37, 80, 68, 70]));
    await pending;
    expect(files.download).not.toHaveBeenCalled();
    expect(exports.status().message).toContain('Your squad changed');
  });

  it('requires a current PDF and sends a copy of its bytes to each browser action', async () => {
    const { files, exports, pdf, state } = setup();
    exports.download();
    exports.openForPrinting();
    expect(files.download).not.toHaveBeenCalled();
    expect(files.openForPrinting).not.toHaveBeenCalled();
    expect(exports.status().phase).toBe('error');
    state.setBandName('Águilas del fuego');
    await pdf.generate();
    exports.download();
    expect(files.download).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]), 'Águilas-del-fuego.pdf');
    files.download.mock.calls[0][0][0] = 0;
    exports.openForPrinting();
    expect(files.openForPrinting).toHaveBeenCalledExactlyOnceWith(new Uint8Array([37, 80, 68, 70]));
    expect(exports.status().message).toContain('print controls');
    state.setBandName('Cuervos');
    expect(exports.status().message).toBe('Ready to generate your sheet.');
    exports.download();
    expect(files.download).toHaveBeenCalledTimes(1);
  });

  it('shows browser errors and allows retrying without regenerating a valid PDF', async () => {
    const { files, exports, pdf } = setup();
    await pdf.generate();
    files.openForPrinting.mockImplementationOnce(() => { throw new Error('Allow pop-ups for this site.'); });
    exports.openForPrinting();
    expect(exports.status()).toEqual({ phase: 'error', message: 'Allow pop-ups for this site.' });
    expect(pdf.hasPdf()).toBe(true);
    exports.download();
    expect(files.download.mock.calls[0][1]).toBe('jutsu-squad.pdf');
    expect(exports.status().message).toBe('Download started.');
  });
});
