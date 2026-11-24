import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { Messages } from '../../core/i18n/i18n-keys';
import { TranslationError } from '../../core/i18n/translation-error';

export interface PendingPdfViewer { show(bytes: Uint8Array): void; close(): void; }

@Injectable({ providedIn: 'root' })
export class PdfBrowserFilesService {
  private readonly document = inject(DOCUMENT);
  private readonly downloads = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly viewers = new Map<string, Window>();
  private readonly pendingViewers = new Set<Window>();
  private viewerTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.dispose());
  }

  download(bytes: Uint8Array, fileName: string): void {
    const url = this.createUrl(bytes);
    const link = this.document.createElement('a');
    try {
      link.href = url;
      link.download = fileName;
      link.hidden = true;
      this.document.body.append(link);
      link.click();
      this.downloads.set(url, setTimeout(() => {
        URL.revokeObjectURL(url);
        this.downloads.delete(url);
      }, 60_000));
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    } finally {
      link.remove();
    }
  }

  openForPrinting(bytes: Uint8Array): void {
    const url = this.createUrl(bytes);
    let viewer: Window | null;
    try {
      viewer = this.document.defaultView?.open(url, '_blank') ?? null;
      if (!viewer) throw new TranslationError(Messages.popupBlocked);
      viewer.opener = null;
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    this.viewers.set(url, viewer);
    this.viewerTimer ??= setInterval(() => this.releaseClosedViewers(), 1000);
  }

  /** Reserve the tab during the click, before asynchronous generation loses user activation. */
  prepareForPrinting(message: string): PendingPdfViewer {
    const viewer = this.document.defaultView?.open('about:blank', '_blank') ?? null;
    if (!viewer) throw new TranslationError(Messages.popupBlocked);
    viewer.opener = null;
    this.pendingViewers.add(viewer);
    try {
      viewer.document.title = message;
      viewer.document.body.textContent = message;
    } catch (error) {
      this.pendingViewers.delete(viewer);
      viewer.close();
      throw error;
    }
    return {
      show: (bytes) => {
        if (!this.pendingViewers.has(viewer) || viewer.closed) throw new TranslationError(Messages.printWindowClosed);
        const url = this.createUrl(bytes);
        try {
          viewer.location.replace(url);
          this.pendingViewers.delete(viewer);
          this.viewers.set(url, viewer);
          this.viewerTimer ??= setInterval(() => this.releaseClosedViewers(), 1000);
        } catch (error) {
          URL.revokeObjectURL(url);
          throw error;
        }
      },
      close: () => { if (this.pendingViewers.delete(viewer)) viewer.close(); },
    };
  }

  private createUrl(bytes: Uint8Array): string {
    if (bytes.byteLength === 0) throw new TranslationError(Messages.emptyPdf);
    return URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' }));
  }

  private releaseClosedViewers(): void {
    for (const [url, viewer] of this.viewers) {
      if (viewer.closed) {
        URL.revokeObjectURL(url);
        this.viewers.delete(url);
      }
    }
    if (this.viewers.size === 0 && this.viewerTimer !== null) {
      clearInterval(this.viewerTimer);
      this.viewerTimer = null;
    }
  }

  private dispose(): void {
    for (const viewer of this.pendingViewers) viewer.close();
    this.pendingViewers.clear();
    for (const [url, timer] of this.downloads) {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    for (const url of this.viewers.keys()) URL.revokeObjectURL(url);
    if (this.viewerTimer !== null) clearInterval(this.viewerTimer);
    this.viewerTimer = null;
    this.downloads.clear();
    this.viewers.clear();
  }
}
