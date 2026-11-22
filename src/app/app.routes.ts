import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/character-sheet/character-sheet').then((m) => m.CharacterSheet) },
  { path: '**', redirectTo: '' },
];
