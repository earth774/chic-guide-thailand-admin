import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, PreloadAllModules, RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { FuseModule } from '@fuse';
import { FuseConfigModule } from '@fuse/services/config';
import { CoreModule } from 'app/core/core.module';
import { appConfig } from 'app/core/config/app.config';
import { LayoutModule } from 'app/layout/layout.module';
import { AppComponent } from 'app/app.component';
import { routes } from 'app/app.routing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Paginator } from './core/paginator/paginator';
import { QuillModule } from 'ngx-quill';
import { TranslocoLocaleModule } from '@ngneat/transloco-locale';
import { environment } from 'environments/environment';

const routerConfig: ExtraOptions = {
  preloadingStrategy: PreloadAllModules,
  scrollPositionRestoration: 'enabled',
};

const langToLocaleMap = environment.languages.reduce((obj, lang) => {
  obj[lang.id] = lang.locale;
  return obj;
}, {});

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, routerConfig),
    FuseModule,
    FuseConfigModule.forRoot(appConfig),
    CoreModule,
    LayoutModule,
    QuillModule.forRoot(),
    MarkdownModule.forRoot({}),
    TranslocoLocaleModule.forRoot({
      langToLocaleMapping: langToLocaleMap,
    }),
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: Paginator }
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
