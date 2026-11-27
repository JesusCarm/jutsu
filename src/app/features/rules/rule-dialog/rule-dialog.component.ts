import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, Injector, signal, untracked, viewChild } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Language } from '../../../core/i18n/languages';
import { Actions, Rules } from '../../../core/i18n/i18n-keys';
import { UiIconComponent } from '../../../shared/ui-icon/ui-icon.component';
import { RulesService } from '../rules.service';
import { RULE_REFERENCES, type RuleId } from '../rule-references';
import type { RuleSection } from '../rule-document';
import { RuleContentComponent } from '../rule-content/rule-content.component';

@Component({
  selector: 'app-rule-dialog', imports: [UiIconComponent, RuleContentComponent],
  templateUrl: './rule-dialog.component.html', styleUrl: './rule-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleDialogComponent {
  protected readonly dialog = inject(DialogRef);
  protected readonly i18n = inject(I18nService);
  protected readonly rules = inject(RulesService);
  protected readonly Actions = Actions;
  protected readonly Rules = Rules;
  protected readonly section = signal<RuleSection | null>(null);
  protected readonly contentLanguage = signal(this.i18n.lang());
  protected readonly current = signal(inject<RuleId>(DIALOG_DATA));
  protected readonly history = signal<readonly RuleId[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly related = signal<readonly { id: RuleId; title: string }[]>([]);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private readonly injector = inject(Injector);
  private readonly destroy = inject(DestroyRef);
  private request = 0;

  constructor() {
    effect(() => {
      const language = this.i18n.lang();
      untracked(() => { void this.load(this.section() !== null, language); });
    });
  }

  protected navigate(id: RuleId): void {
    if (id === this.current()) return;
    this.history.update((history) => [...history, this.current()]);
    this.current.set(id);
    void this.load(true);
  }

  protected back(): void {
    const history = [...this.history()];
    const id = history.pop();
    if (!id) return;
    this.history.set(history);
    this.current.set(id);
    void this.load(true);
  }

  protected async load(focus = false, language: Language = this.i18n.lang()): Promise<void> {
    const request = ++this.request;
    this.loading.set(true); this.failed.set(false); this.section.set(null); this.related.set([]);
    try {
      const section = await this.rules.load(this.current(), language);
      if (request !== this.request || this.destroy.destroyed || language !== this.i18n.lang()) return;
      this.contentLanguage.set(language); this.section.set(section); this.loading.set(false);
      afterNextRender(() => {
        if (request !== this.request) return;
        if (this.content()) this.content()!.nativeElement.scrollTop = 0;
        if (focus) this.heading()?.nativeElement.focus();
      }, { injector: this.injector });
      const related = await Promise.all((RULE_REFERENCES[this.current()].related ?? []).map(async (id) => {
        try { return { id, title: (await this.rules.load(id, language)).title }; } catch { return null; }
      }));
      if (request === this.request && !this.destroy.destroyed && language === this.i18n.lang()) this.related.set(related.filter((entry) => entry !== null));
    } catch {
      if (request === this.request && !this.destroy.destroyed && language === this.i18n.lang()) { this.loading.set(false); this.failed.set(true); }
    }
  }
}
