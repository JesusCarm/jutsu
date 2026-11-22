import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppLayout } from './layout/app-layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppLayout],
  template: `<app-layout><router-outlet /></app-layout>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
