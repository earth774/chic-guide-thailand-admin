import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from 'environments/environment';
import { AppModule } from 'app/app.module';

import * as Parse from 'parse';
import { UserPackage } from 'app/modules/admin/user-package/user-package.model';

if (environment.production) {
  enableProdMode();
}

Parse.initialize(environment.appId);
(Parse as any).serverURL = environment.serverUrl;
(Parse as any).idempotency = true;

UserPackage.getInstance();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
