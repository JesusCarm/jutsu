import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/character-sheet/character-sheet.component').then((m) => m.CharacterSheetComponent) },
  { path: '**', redirectTo: '' },
];
