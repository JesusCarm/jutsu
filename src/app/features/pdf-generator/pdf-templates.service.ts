import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { PlatformAssetsService } from '../../core/services/platform-assets.service';
import { JutsuPdfTemplate } from './jutsu-pdf-template';
import { NinjaGridPdfTemplate } from './ninja-grid-pdf-template';
import type { PdfTemplate } from './pdf-types';
import { Labels, type TranslationKey } from '../../core/i18n/i18n-keys';
import type { Language } from '../../core/i18n/languages';

export interface PdfTemplateOption {
  readonly id: string;
  readonly labelKey: TranslationKey;
  readonly create: (assetBase: string) => PdfTemplate;
  readonly localized?: Partial<Record<Language, (assetBase: string) => PdfTemplate>>;
}

export const PDF_TEMPLATE_OPTIONS = new InjectionToken<readonly PdfTemplateOption[]>('Available sheet templates', {
  providedIn: 'root',
  factory: () => [{
    id: 'jutsu-fichas-rellenables',
    labelKey: Labels.jutsuTemplate,
    create: (base) => new JutsuPdfTemplate(base),
  }, {
    id: 'ninja-grid',
    labelKey: Labels.ninjaGridTemplate,
    create: (base) => new NinjaGridPdfTemplate(base),
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

  getTemplate(id: string, language: Language = 'en'): PdfTemplate {
    const option = this.find(id);
    return (option.localized?.[language] ?? option.create)(this.assets.baseUrl);
  }

  private find(id: string): PdfTemplateOption {
    const template = this.options.find((option) => option.id === id);
    if (!template) throw new RangeError(`Unknown PDF template: ${id}`);
    return template;
  }
}
