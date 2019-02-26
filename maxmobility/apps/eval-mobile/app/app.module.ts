import { HttpClientModule } from '@angular/common/http';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CORE_PROVIDERS } from '@maxmobility/core';
import { MobileCoreModule } from '@maxmobility/mobile';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';
import { ModalDialogService } from 'nativescript-angular/modal-dialog';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { DropDownModule } from 'nativescript-drop-down/angular';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { YoutubePlayerModule } from 'nativescript-youtubeplayer/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './modules/core/core.module';
import { ActionbarComponent } from './modules/shared/components/actionbar/actionbar.component';
import { SharedModule } from './modules/shared/shared.module';
import { PrivacyPolicyComponent } from './privacy-policy';
import { TNSTranslateLoader } from './utils';

// factories
export function createTranslateLoader() {
  return new TNSTranslateLoader('/assets/i18n/');
}

@NgModule({
  bootstrap: [AppComponent],
  entryComponents: [PrivacyPolicyComponent, ActionbarComponent],
  imports: [
    NativeScriptCommonModule,
    NativeScriptModule,
    NativeScriptHttpClientModule,
    NativeScriptUIListViewModule,
    SharedModule,
    CoreModule,
    MobileCoreModule,
    AppRoutingModule,
    HttpClientModule,
    DropDownModule,
    YoutubePlayerModule,
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
