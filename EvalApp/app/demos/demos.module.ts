import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SharedModule } from "../shared/shared.module";
import { DemosRoutingModule } from "./demos-routing.module";
import { DemosComponent } from "./demos.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        DemosRoutingModule,
        SharedModule
    ],
    declarations: [
        DemosComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class DemosModule { }
