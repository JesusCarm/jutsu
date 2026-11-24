import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfBrowserFilesService } from './pdf-browser-files.service';

describe('PDF browser files', () => {
  const createUrl = vi.fn<(blob: Blob) => string>();
  const revokeUrl = vi.fn<(url: string) => void>();
  let files: PdfBrowserFilesService;

  beforeEach(() => {
    vi.useFakeTimers();
    createUrl.mockReset().mockImplementation(() => `blob:sheet-${createUrl.mock.calls.length}`);
    revokeUrl.mockReset();
    const NativeURL = URL;
    vi.stubGlobal('URL', class extends NativeURL {
      static override createObjectURL = createUrl;
      static override revokeObjectURL = revokeUrl;
    });
    files = TestBed.inject(PdfBrowserFilesService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('clicks an attached download link with a PDF Blob and releases its URL after the download starts', () => {
    const clicks: { name: string; url: string; attached: boolean }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push({ name: this.download, url: this.href, attached: document.body.contains(this) });
    });
    files.download(new Uint8Array([37, 80, 68, 70]), 'Cuervos.pdf');
    expect(clicks).toEqual([{ name: 'Cuervos.pdf', url: 'blob:sheet-1', attached: true }]);
    expect(createUrl.mock.calls[0][0].type).toBe('application/pdf');
    expect(createUrl.mock.calls[0][0].size).toBe(4);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revokeUrl).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:sheet-1');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('opens the PDF synchronously and keeps it available until the viewer closes', () => {
    const viewer = { closed: false, opener: window };
    const open = vi.spyOn(window, 'open').mockReturnValue(viewer as unknown as Window);
    files.openForPrinting(new Uint8Array([1, 2]));
    expect(open).toHaveBeenCalledExactlyOnceWith('blob:sheet-1', '_blank');
    expect(viewer.opener).toBeNull();
    vi.advanceTimersByTime(60_000);
    expect(revokeUrl).not.toHaveBeenCalled();
    viewer.closed = true;
    vi.advanceTimersByTime(1000);
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:sheet-1');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports a blocked tab and releases its unused URL', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    expect(() => files.openForPrinting(new Uint8Array([1]))).toThrow('messages.popupBlocked');
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:sheet-1');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up a failed download and rejects empty PDFs', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('Download failed'); });
    expect(() => files.download(new Uint8Array([1]), 'sheet.pdf')).toThrow('Download failed');
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:sheet-1');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(() => files.openForPrinting(new Uint8Array())).toThrow('messages.emptyPdf');
    expect(createUrl).toHaveBeenCalledTimes(1);
  });

  it('releases remaining URLs and timers when the application is destroyed', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.spyOn(window, 'open').mockReturnValue({ closed: false, opener: null } as Window);
    files.download(new Uint8Array([1]), 'sheet.pdf');
    files.openForPrinting(new Uint8Array([2]));
    TestBed.resetTestingModule();
    expect(revokeUrl.mock.calls).toEqual([['blob:sheet-1'], ['blob:sheet-2']]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
