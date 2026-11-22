import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-layout',
  template: `
    <a class="skip-link" href="#main-content">Ir al editor de escuadra</a>
    <main id="main-content" class="container main-content"><ng-content /></main>
    <footer class="site-footer container"><p>Jutsu <span aria-hidden="true">·</span> Gipsy Games</p><span>3 ninjas. Una escuadra.</span></footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {}
