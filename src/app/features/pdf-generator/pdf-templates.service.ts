import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { PlatformAssetsService } from '../../core/services/platform-assets.service';
import { JutsuPdfTemplate } from './jutsu-pdf-template';
import type { PdfTemplate } from './pdf-types';

export interface PdfTemplateOption {
  readonly id: string;
  readonly label: string;
  readonly create: (assetBase: string) => PdfTemplate;
}

export const PDF_TEMPLATE_OPTIONS = new InjectionToken<readonly PdfTemplateOption[]>('Available sheet templates', {
  providedIn: 'root',
  factory: () => [{
    id: 'jutsu-fichas-rellenables',
    label: 'Jutsu — three ninjas per page',
    create: (base) => new JutsuPdfTemplate(base),
  }],
});

@Injectable({ providedIn: 'root' })
export class PdfTemplatesService {
  readonly options = inject(PDF_TEMPLATE_OPTIONS);
  private readonly assets = inject(PlatformAssetsService);
  private readonly selection = signal({ id: this.options[0].id, revision: 0 });
  readonly selectedId = computed(() => this.selection().id);
  readonly revision = computed(() => this.selection().revision);
  readonly selected = computed(() => this.find(this.selectedId()));

  select(id: string): void {
    this.find(id);
    if (id !== this.selectedId()) {
      this.selection.update((selection) => ({ id, revision: selection.revision + 1 }));
    }
  }

  getTemplate(id: string): PdfTemplate {
    return this.find(id).create(this.assets.baseUrl);
  }

  private find(id: string): PdfTemplateOption {
    const template = this.options.find((option) => option.id === id);
    if (!template) throw new RangeError(`Unknown PDF template: ${id}`);
    return template;
  }
}
