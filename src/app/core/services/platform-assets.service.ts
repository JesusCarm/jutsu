import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PlatformAssetsService {
  private readonly document = inject(DOCUMENT);
  readonly baseUrl = new URL('assets/', this.document.baseURI).href;

  publicUrl(path: string): string {
    return new URL(path, this.document.baseURI).href;
  }
}
