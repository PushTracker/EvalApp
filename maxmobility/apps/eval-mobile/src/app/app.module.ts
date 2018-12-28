import { HttpClientModule } from '@angular/common/http';
import {
  NgModule,
  NO_ERRORS_SCHEMA,
  NgModuleFactoryLoader
} from '@angular/core';
import { CORE_PROVIDERS } from '@maxmobility/core';
import { MobileCoreModule } from '@maxmobility/mobile';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { ModalDialogService } from 'nativescript-angular/modal-dialog';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { DropDownModule } from 'nativescript-drop-down/angular';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { YoutubePlayerModule } from 'nativescript-youtubeplayer/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './modules/core/core.module';
import { SharedModule } from './modules/shared/shared.module';
import { PrivacyPolicyComponent } from '../app/modules/privacy-policy/privacy-policy.component';
import { TNSTranslateLoader } from './utils';
import { NSModuleFactoryLoader } from 'nativescript-angular/router';

// factories
export function createTranslateLoader() {
  return new TNSTranslateLoader('/assets/i18n/');
}

@NgModule({
  bootstrap: [AppComponent],
  // entryComponents: [PrivacyPolicyComponent],
  entryComponents: [],
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
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader
      }
    })
  ],
  // declarations: [AppComponent, PrivacyPolicyComponent],
  declarations: [AppComponent],
  providers: [
    ...CORE_PROVIDERS,
    ModalDialogService,
    { provide: NgModuleFactoryLoader, useClass: NSModuleFactoryLoader }
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
