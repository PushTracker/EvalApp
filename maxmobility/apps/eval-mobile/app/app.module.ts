// angular
import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
// app
import { CORE_PROVIDERS } from '@maxmobility/core';
import { MobileCoreModule } from '@maxmobility/mobile';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
// nativescript
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { SlidesModule } from 'nativescript-ngx-slides';
import { DropDownModule } from 'nativescript-drop-down/angular';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './modules/core/core.module';
import { SharedModule } from './modules/shared/shared.module';
import { TNSTranslateLoader } from './utils';
import { YoutubePlayerModule } from 'nativescript-youtubeplayer/angular';

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
    NativeScriptUISideDrawerModule,
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
  declarations: [AppComponent],
  providers: [...CORE_PROVIDERS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
