import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-layout',
  template: `
    <a class="skip-link" href="#main-content">Skip to squad editor</a>
    <header class="site-header"><div class="container">
      <p class="brand">Gipsy Games</p><h1>Jutsu Band Builder</h1>
      <p class="intro">Create your ninja squad and generate your character sheet.</p>
    </div></header>
    <main id="main-content" class="container main-content"><ng-content /></main>
    <footer class="site-footer container"><p>Jutsu · Gipsy Games</p></footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {}
