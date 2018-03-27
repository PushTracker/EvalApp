// angular
import { NgModule, NgModuleFactoryLoader, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
// nativescript
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
// app
import { CORE_PROVIDERS } from '@maxmobility/core';
import { SharedModule } from './modules/shared/shared.module';
import { CoreModule } from './modules/core/core.module';
import { MobileCoreModule } from '@maxmobility/mobile';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// libs
import { NgProgressModule } from 'ngx-progressbar';
import { DropDownModule } from 'nativescript-drop-down/angular';

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
    DropDownModule
  ],
  declarations: [AppComponent],
  providers: [...CORE_PROVIDERS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
