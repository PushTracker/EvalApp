import { NgModule, NgModuleFactoryLoader, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptHttpModule } from "nativescript-angular/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { NgProgressModule } from "ngx-progressbar";

import { HttpClient, HttpClientModule } from "@angular/common/http";

import { LoginService } from "./shared/login.service";

// import { NativeScriptUIListViewModule } from "nativescript-pro-ui/listview/angular";

// import { TNSFrescoModule } from "nativescript-fresco/angular";

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
	NativeScriptHttpModule,
        AppRoutingModule,
	HttpClientModule
    ],
    declarations: [
        AppComponent
    ],
    providers: [
	LoginService
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AppModule { }
