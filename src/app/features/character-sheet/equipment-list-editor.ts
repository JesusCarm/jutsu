import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, Injector, input, viewChildren } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { CdkMonitorFocus, FocusMonitor } from '@angular/cdk/a11y';
import { ElementRef } from '@angular/core';
import type { EquipmentDefinition, EquipmentKind } from '../../core/models/game-types';
import { BandState } from './band-state';
import { CatalogSelect } from './catalog-select';

@Component({
  selector: 'app-equipment-list-editor',
  imports: [MatButton, CatalogSelect, CdkMonitorFocus],
  template: `
    <fieldset class="equipment-editor"><legend>{{ kind() === 'weapons' ? 'Weapons' : 'Items' }}</legend>
      <p class="equipment-count" role="status">{{ entries().length }} / {{ limit() }} {{ kind() }}</p>
      <div class="equipment-list">
        @for (entry of entries(); track $index) {
          <fieldset class="equipment-entry"><legend>{{ kind() === 'weapons' ? 'Weapon' : 'Item' }} {{ $index + 1 }}</legend>
            <div #entryControl cdkMonitorSubtreeFocus>
              <app-catalog-select [label]="kind() === 'weapons' ? 'Weapon' : 'Item'" [placeholder]="'Choose a ' + singular()"
                [controlId]="'ninja-' + (ninjaIndex() + 1) + '-' + singular() + '-' + ($index + 1) + '-name'"
                [value]="entry.name" [options]="options()" (selected)="state.selectEquipment(ninjaIndex(), kind(), $index, $event)" />
            </div>
            <dl class="equipment-details">
              <div class="read-only-field"><dt>Short description</dt><dd>{{ entry.description || '—' }}</dd></div>
              <div class="read-only-field"><dt>Action cost</dt><dd>{{ entry.cost || '—' }}</dd></div>
            </dl>
            <button matButton type="button" class="remove-button" [attr.aria-label]="'Remove ' + singular() + ' ' + ($index + 1) + ' from Ninja ' + (ninjaIndex() + 1)"
              (click)="remove($index)">Remove {{ singular() }}</button>
          </fieldset>
        } @empty { <p class="empty-list">{{ options().length ? 'No ' + kind() + ' added.' : 'No ' + kind() + ' available.' }}</p> }
      </div>
      <button #addButton matButton="tonal" type="button" class="add-button" [disabled]="entries().length >= limit() || !options().length"
        [attr.aria-label]="'Add ' + singular() + ' to Ninja ' + (ninjaIndex() + 1)" (click)="add()">Add {{ singular() }}</button>
    </fieldset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentListEditor {
  readonly kind = input.required<EquipmentKind>();
  readonly entries = input.required<readonly EquipmentDefinition[]>();
  readonly ninjaIndex = input.required<number>();
  protected readonly state = inject(BandState);
  protected readonly singular = computed(() => this.kind() === 'weapons' ? 'weapon' : 'item');
  protected readonly limit = computed(() => this.kind() === 'weapons' ? 3 : 2);
  protected readonly options = computed(() => this.state.catalog.getEquipment(this.kind()));
  private readonly injector = inject(Injector);
  private readonly focus = inject(FocusMonitor);
  private readonly controls = viewChildren<ElementRef<HTMLElement>>('entryControl');
  private readonly addButtons = viewChildren<ElementRef<HTMLButtonElement>>('addButton');

  protected add(): void {
    this.state.addEquipment(this.ninjaIndex(), this.kind());
    this.restoreFocus(this.entries().length);
  }

  protected remove(index: number): void {
    this.state.removeEquipment(this.ninjaIndex(), this.kind(), index);
    this.restoreFocus(index);
  }

  private restoreFocus(index: number): void {
    // The only DOM query: retain the original keyboard focus after dynamic list edits.
    afterNextRender(() => {
      const controls = this.controls();
      const select = controls[Math.min(index, controls.length - 1)]?.nativeElement.querySelector('select');
      const target = select ?? this.addButtons()[0]?.nativeElement;
      if (target) this.focus.focusVia(target, 'program');
    }, { injector: this.injector });
  }
}
