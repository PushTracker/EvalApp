import { HttpClientModule } from '@angular/common/http';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CORE_PROVIDERS } from '@maxmobility/core';
import { MobileCoreModule } from '@maxmobility/mobile';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { DropDownModule } from 'nativescript-drop-down/angular';
import { SlidesModule } from 'nativescript-ngx-slides';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './modules/core/core.module';
import { SharedModule } from './modules/shared/shared.module';
import { TNSTranslateLoader } from './utils';
import { YoutubePlayerModule } from 'nativescript-youtubeplayer/angular';
import { ModalDialogService } from 'nativescript-angular/modal-dialog';
import { PrivacyPolicyComponent } from './privacy-policy';

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
    SlidesModule,
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
