import { HttpClientModule } from '@angular/common/http';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CORE_PROVIDERS } from '@maxmobility/core';
import { MobileCoreModule } from '@maxmobility/mobile';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { ModalDialogService } from 'nativescript-angular/modal-dialog';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { DropDownModule } from 'nativescript-drop-down/angular';
import { SentryModule } from 'nativescript-sentry/angular';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { YoutubePlayerModule } from 'nativescript-youtubeplayer/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './modules/core/core.module';
import { SharedModule } from './modules/shared/shared.module';
import { PrivacyPolicyComponent } from './privacy-policy';
import { TNSTranslateLoader } from './utils';

// https://github.com/danielgek/nativescript-sentry/issues/7
//import * as Raven from 'raven-js';
//(<any>Raven)._hasDocument = false;

// factories
export function createTranslateLoader() {
  return new TNSTranslateLoader('/assets/i18n/');
}

@NgModule({
  bootstrap: [AppComponent],
  entryComponents: [PrivacyPolicyComponent],
  imports: [
    NativeScriptCommonModule,
    NativeScriptModule,
    NativeScriptHttpModule,
    NativeScriptUIListViewModule,
    SharedModule,
    CoreModule,
    MobileCoreModule,
    AppRoutingModule,
    HttpClientModule,
    DropDownModule,
    YoutubePlayerModule,
    SentryModule.forRoot({
      dsn:
        'https://aaa25eb556fa476a92e0edea6dd57af6:65c984b9260e47f0bb128def7eddd5f4@sentry.io/306438'
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader
      }
    })
  ],
  declarations: [AppComponent, PrivacyPolicyComponent],
  providers: [...CORE_PROVIDERS, ModalDialogService],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
