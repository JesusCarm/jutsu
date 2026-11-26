import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Messages } from '../../core/i18n/i18n-keys';
import type { LocalizedBandSnapshot } from '../../core/i18n/game-text';
import { BandPdfWorkerClient, type PdfWorkerConnection } from './band-pdf-worker-client';
import { GENERATE_BAND_PDF } from './pdf-generation.service';
import type { PdfTemplate } from './pdf-types';
import { localizeBand } from '../../../../tests/fixtures/localized-band.js';

const band: LocalizedBandSnapshot = localizeBand({ name: 'Ravens', ninjas: [] });
const template: PdfTemplate = { configUrl: 'https://example.test/jutsu/assets/layout.json', fontUrls: {} };

function connection(): PdfWorkerConnection {
  return { postMessage: vi.fn(), terminate: vi.fn(), onmessage: null, onerror: null, onmessageerror: null };
}

function respond(worker: PdfWorkerConnection, data: unknown): void {
  worker.onmessage?.call(worker as Worker, new MessageEvent('message', { data }));
}

describe('PDF worker client', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('completes through a worker message with page timers and animation frames suspended', async () => {
    vi.useFakeTimers();
    const worker = connection();
    const client = new BandPdfWorkerClient(() => worker);
    const pending = client.generate(band, template);
    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ band, template });
    const bytes = new Uint8Array([37, 80, 68, 70]);
    respond(worker, { kind: 'success', bytes });
    await expect(pending).resolves.toBe(bytes);
    expect(vi.getTimerCount()).toBe(0);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
  });

  it.each(['generation', 'script', 'message', 'invalid', 'post'])('rejects %s failures and releases the worker', async (failure) => {
    const worker = connection();
    if (failure === 'post') vi.mocked(worker.postMessage).mockImplementation(() => { throw new Error('Cannot clone request'); });
    const pending = new BandPdfWorkerClient(() => worker).generate(band, template);
    if (failure === 'generation') respond(worker, { kind: 'error', message: 'Unable to generate ninja 2: Text does not fit' });
    if (failure === 'invalid') respond(worker, { kind: 'success', bytes: 'not a PDF' });
    if (failure === 'script') worker.onerror?.call(worker as Worker, new ErrorEvent('error', { message: 'Worker script failed' }));
    if (failure === 'message') worker.onmessageerror?.call(worker as Worker, new MessageEvent('messageerror'));
    await expect(pending).rejects.toThrow(failure === 'generation' ? 'Unable to generate ninja 2' : failure === 'script' ? 'Worker script failed'
      : failure === 'post' ? 'Cannot clone request' : Messages.pdfWorkerFailed);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(worker.onmessage).toBeNull();
    expect(worker.onerror).toBeNull();
    expect(worker.onmessageerror).toBeNull();
  });

  it('uses a fresh worker for each generation', async () => {
    const first = connection(); const second = connection();
    const create = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const client = new BandPdfWorkerClient(create);
    const pending = client.generate(band, template);
    respond(first, { kind: 'success', bytes: new Uint8Array([1]) });
    await pending;
    const next = client.generate(band, template);
    respond(second, { kind: 'success', bytes: new Uint8Array([2]) });
    await expect(next).resolves.toEqual(new Uint8Array([2]));
    expect(first.terminate).toHaveBeenCalledTimes(1);
    expect(second.terminate).toHaveBeenCalledTimes(1);
  });

  it('routes the application generation provider through a module worker', async () => {
    const worker = connection();
    const WorkerConstructor = vi.fn(function () { return worker; });
    vi.stubGlobal('Worker', WorkerConstructor);
    const pending = TestBed.inject(GENERATE_BAND_PDF)(band, template);
    await vi.waitFor(() => expect(worker.postMessage).toHaveBeenCalledTimes(1));
    expect(WorkerConstructor).toHaveBeenCalledWith(expect.any(URL), { type: 'module' });
    respond(worker, { kind: 'success', bytes: new Uint8Array([1]) });
    await expect(pending).resolves.toEqual(new Uint8Array([1]));
  });

  it('reports an unsupported environment without falling back to the page thread', async () => {
    vi.stubGlobal('Worker', undefined);
    await expect(new BandPdfWorkerClient().generate(band, template)).rejects.toMatchObject({ key: Messages.pdfWorkerUnavailable });
  });
});
