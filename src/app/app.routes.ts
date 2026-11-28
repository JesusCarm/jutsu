import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // One route configuration preserves the editor and its controls when switching language.
    matcher: (segments) => segments.length === 0 || (segments[0].path === 'es' && segments.slice(1).every((segment) => segment.path === ''))
      ? { consumed: segments } : null,
    loadComponent: () => import('./features/character-sheet/character-sheet.component').then((m) => m.CharacterSheetComponent),
  },
  { path: '**', redirectTo: '' },
];
