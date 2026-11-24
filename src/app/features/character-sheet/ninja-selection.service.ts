import { Injectable, inject, type Type } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import type { EquipmentKind } from '../../core/models/game-types';
import { BandStateService } from './band-state.service';
import { NinjaTypeDialogComponent } from './ninja-type-dialog/ninja-type-dialog.component';
import { WeaponDialogComponent } from './weapon-dialog/weapon-dialog.component';
import { ItemDialogComponent } from './item-dialog/item-dialog.component';
import { TechniqueSchoolDialogComponent } from './technique-school-dialog/technique-school-dialog.component';
import type { EquipmentSelectionData, NinjaSelectionData } from './selection-dialog-data';

@Injectable({ providedIn: 'root' })
export class NinjaSelectionService {
  private readonly dialogs = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly state = inject(BandStateService);

  type(ninjaIndex: number): void {
    this.open(NinjaTypeDialogComponent, { ninjaIndex }, (id) => this.state.selectType(ninjaIndex, id));
  }

  equipment(ninjaIndex: number, kind: EquipmentKind, slot: number): void {
    const apply = (id: string) => this.state.selectEquipmentSlot(ninjaIndex, kind, slot, id);
    if (kind === 'weapons') this.open(WeaponDialogComponent, { ninjaIndex, slot }, apply);
    else this.open(ItemDialogComponent, { ninjaIndex, slot }, apply);
  }

  school(ninjaIndex: number): void {
    this.open(TechniqueSchoolDialogComponent, { ninjaIndex }, (id) => this.state.selectGroup(ninjaIndex, id));
  }

  private open<C>(component: Type<C>, data: NinjaSelectionData | EquipmentSelectionData, apply: (id: string) => void): void {
    if (this.dialogs.openDialogs.length) return;
    this.dialogs.open<string, typeof data, C>(component, {
      data, width: '36rem', maxWidth: '100vw', height: '100dvh', maxHeight: '100dvh',
      positionStrategy: this.overlay.position().global().right('0').top('0'),
      panelClass: 'selection-side-panel', ariaLabelledBy: 'selection-panel-title', ariaModal: true, disableAnimations: true,
      autoFocus: '.selection-card.is-current button, button.selection-card.is-current', restoreFocus: true,
    }).closed.subscribe((id) => { if (id !== undefined) apply(id); });
  }
}
