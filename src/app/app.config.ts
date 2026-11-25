import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { I18nService } from './core/i18n/i18n.service';
import { AnalyticsService } from './core/analytics/analytics.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), provideRouter(routes),
    provideAppInitializer(() => inject(I18nService).initialize()),
    provideAppInitializer(() => inject(AnalyticsService).initialize()),
  ],
};
