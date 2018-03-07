import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SharedModule } from "../shared/shared.module";
import { EvalEntryRoutingModule } from "./evalEntry-routing.module";
import { EvalEntryComponent } from "./evalEntry.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        EvalEntryRoutingModule,
        SharedModule
    ],
    declarations: [
        EvalEntryComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class EvalEntryModule { }
