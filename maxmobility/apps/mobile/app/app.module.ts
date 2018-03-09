// angular
import { NgModule, NgModuleFactoryLoader, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
// nativescript
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
// app
import { CoreModule } from './modules/core/core.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginService } from './shared/login.service';
// libs
import { NgProgressModule } from 'ngx-progressbar';
import { DropDownModule } from 'nativescript-drop-down/angular';

@NgModule({
  bootstrap: [AppComponent],
  imports: [NativeScriptModule, NativeScriptHttpModule, CoreModule, AppRoutingModule, HttpClientModule, DropDownModule],
  declarations: [AppComponent],
  providers: [LoginService],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
