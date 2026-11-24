import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  console.error(error);
  // This fallback also works when the reference dictionary itself could not load.
  const root = document.querySelector('app-root');
  if (root) {
    root.setAttribute('role', 'alert');
    root.textContent = 'Could not start Jutsu. Check your connection and reload the page.';
  }
});
