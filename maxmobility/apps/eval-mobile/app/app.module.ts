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

// factories
export function createTranslateLoader() {
  return new TNSTranslateLoader('/assets/i18n/');
}

@NgModule({
  bootstrap: [AppComponent],
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
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader
      }
    })
  ],
  declarations: [AppComponent],
  providers: [...CORE_PROVIDERS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
