import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { analytics } from './analytics';

// analytics
if ( environment.production ) {
  enableProdMode();
}

document.write(`<script type="text/javascript">${environment.production ? analytics.production : analytics.development}</script>`);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.log(err));
