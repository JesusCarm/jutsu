import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfBrowserFiles {
  private readonly document = inject(DOCUMENT);
  private readonly downloads = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly viewers = new Map<string, Window>();
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
      if (!viewer) throw new Error('The PDF tab was blocked. Allow pop-ups for this site and try again.');
      viewer.opener = null;
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    this.viewers.set(url, viewer);
    this.viewerTimer ??= setInterval(() => this.releaseClosedViewers(), 1000);
  }

  private createUrl(bytes: Uint8Array): string {
    if (bytes.byteLength === 0) throw new Error('The PDF is empty. Generate the sheet again.');
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
