import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SharedModule } from "../shared/shared.module";
import { SummaryRoutingModule } from "./summary-routing.module";
import { SummaryComponent } from "./summary.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        SummaryRoutingModule,
        SharedModule
    ],
    declarations: [
        SummaryComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class SummaryModule { }
