import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Language } from '../../../core/i18n/languages';
import { Actions, Rules } from '../../../core/i18n/i18n-keys';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { RULE_CHAPTERS } from '../rule-chapters';
import { RULE_REFERENCES } from '../rule-references';
import { RuleContentComponent } from '../rule-content/rule-content.component';
import { RuleDialogsService } from '../rule-dialogs.service';
import { RulesService, type RuleEntry } from '../rules.service';

@Component({
  selector: 'app-quick-reference-dialog', imports: [UiIconComponent, RuleContentComponent],
  templateUrl: './quick-reference-dialog.component.html', styleUrl: './quick-reference-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickReferenceDialogComponent {
  protected readonly dialog = inject(DialogRef);
  protected readonly i18n = inject(I18nService);
  protected readonly rules = inject(RulesService);
  protected readonly dialogs = inject(RuleDialogsService);
  protected readonly Actions = Actions;
  protected readonly Rules = Rules;
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly contentLanguage = signal(this.i18n.lang());
  private readonly entries = signal<readonly RuleEntry[]>([]);
  protected readonly chapters = computed(() => RULE_CHAPTERS.map((chapter, index) => ({
    id: `quick-reference-chapter-${index}`, title: this.i18n.t(chapter.title),
    entries: this.entries().filter((entry) => RULE_REFERENCES[entry.id].file === chapter.file),
  })).filter((chapter) => chapter.entries.length));
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private readonly destroy = inject(DestroyRef);
  private request = 0;

  constructor() {
    effect(() => {
      const language = this.i18n.lang();
      untracked(() => { void this.load(language); });
    });
  }

  protected goToChapter(id: string): void {
    const heading = this.content()?.nativeElement.querySelector<HTMLElement>(`#${id}`);
    heading?.scrollIntoView?.({ block: 'start' });
    heading?.focus({ preventScroll: true });
  }

  protected async load(language: Language = this.i18n.lang()): Promise<void> {
    const request = ++this.request;
    this.loading.set(true); this.failed.set(false);
    try {
      const entries = await this.rules.loadAll(language);
      if (request !== this.request || this.destroy.destroyed || language !== this.i18n.lang()) return;
      this.contentLanguage.set(language); this.entries.set(entries); this.loading.set(false);
    } catch {
      if (request !== this.request || this.destroy.destroyed || language !== this.i18n.lang()) return;
      this.entries.set([]); this.loading.set(false); this.failed.set(true);
    }
  }
}
