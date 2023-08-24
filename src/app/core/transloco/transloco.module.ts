import { Translation, TRANSLOCO_CONFIG, TRANSLOCO_LOADER, translocoConfig, TranslocoModule } from '@ngneat/transloco';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { environment } from 'environments/environment';
import { TranslocoHttpLoader } from 'app/core/transloco/transloco.http-loader';
import { TranslocoPersistLangModule, TRANSLOCO_PERSIST_LANG_STORAGE } from '@ngneat/transloco-persist-lang';

const languages = environment.languages;
const defaultLanguage = languages.find(lang => lang.default);

@NgModule({
  imports: [
    TranslocoPersistLangModule.forRoot({
      storage: {
        provide: TRANSLOCO_PERSIST_LANG_STORAGE,
        useValue: localStorage,
      },
    }),
  ],
  exports: [
    TranslocoModule
  ],
  providers: [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: languages,
        defaultLang: defaultLanguage.id,
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: environment.production
      })
    },
    {
      provide: TRANSLOCO_LOADER,
      useClass: TranslocoHttpLoader
    },
  ]
})
export class TranslocoCoreModule { }
