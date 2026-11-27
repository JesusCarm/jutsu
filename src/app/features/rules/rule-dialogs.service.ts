import { inject, Injectable } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { RuleDialogComponent } from './rule-dialog/rule-dialog.component';
import { QuickReferenceDialogComponent } from './quick-reference-dialog/quick-reference-dialog.component';
import type { RuleId } from './rule-references';

@Injectable({ providedIn: 'root' })
export class RuleDialogsService {
  private readonly dialogs = inject(Dialog);

  openOverview(): void {
    if (this.dialogs.getDialogById('quick-reference-dialog')) return;
    this.dialogs.open(QuickReferenceDialogComponent, {
      id: 'quick-reference-dialog', width: '68rem', maxWidth: 'calc(100vw - 1.5rem)', maxHeight: '88dvh',
      panelClass: 'rules-dialog', ariaLabelledBy: 'quick-reference-title', ariaModal: true,
      disableAnimations: true, autoFocus: '.quick-reference-close', restoreFocus: true,
    });
  }

  open(id: RuleId): void {
    if (this.dialogs.getDialogById('rules-dialog')) return;
    this.dialogs.open<void, RuleId>(RuleDialogComponent, {
      id: 'rules-dialog', data: id, width: '42rem', maxWidth: 'calc(100vw - 1.5rem)', maxHeight: '88dvh',
      panelClass: 'rules-dialog', ariaLabelledBy: 'rule-dialog-title', ariaModal: true,
      disableAnimations: true, autoFocus: '.rule-close', restoreFocus: true,
    });
  }
}
