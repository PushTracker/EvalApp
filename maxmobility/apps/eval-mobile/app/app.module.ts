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
import { CoreModule } from './modules/core/core.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginService } from './shared/login.service';
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
    CoreModule,
    AppRoutingModule,
    HttpClientModule,
    DropDownModule
  ],
  declarations: [AppComponent],
  providers: [LoginService, ...CORE_PROVIDERS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
