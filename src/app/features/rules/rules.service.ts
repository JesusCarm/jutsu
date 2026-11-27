import { inject, Injectable, InjectionToken } from '@angular/core';
import { PlatformAssetsService } from '../../core/services/platform-assets.service';
import type { Language } from '../../core/i18n/languages';
import { readRuleDocument, type RuleSection } from './rule-document';
import { RULE_REFERENCES, ruleDocumentPath, type RuleId } from './rule-references';

export type RuleDocumentFetch = (url: string) => Promise<string>;
export interface RuleEntry { readonly id: RuleId; readonly section: RuleSection; }
export const RULE_DOCUMENT_FETCH = new InjectionToken<RuleDocumentFetch>('Load a rule document', {
  providedIn: 'root', factory: () => async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load rules (${response.status}).`);
    return response.text();
  },
});

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly assets = inject(PlatformAssetsService);
  private readonly fetchDocument = inject(RULE_DOCUMENT_FETCH);
  private readonly documents = new Map<string, Promise<ReadonlyMap<string, RuleSection>>>();

  async load(id: RuleId, language: Language): Promise<RuleSection> {
    const reference = RULE_REFERENCES[id];
    const file = ruleDocumentPath(id, language);
    let document = this.documents.get(file);
    if (!document) {
      document = this.fetchDocument(new URL(file, this.assets.baseUrl).href)
        .then(readRuleDocument).catch((error: unknown) => { this.documents.delete(file); throw error; });
      this.documents.set(file, document);
    }
    const section = (await document).get(reference.anchor);
    if (!section) { this.documents.delete(file); throw new Error(`Missing rule section: ${language}/${id}`); }
    return section;
  }

  loadAll(language: Language): Promise<readonly RuleEntry[]> {
    return Promise.all((Object.keys(RULE_REFERENCES) as RuleId[]).map(async (id) => ({
      id, section: await this.load(id, language),
    })));
  }

  imageUrl(path: string): string { return this.assets.publicUrl(path); }
}
