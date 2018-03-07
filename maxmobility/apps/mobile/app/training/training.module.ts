import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SharedModule } from "../shared/shared.module";
import { TrainingRoutingModule } from "./training-routing.module";
import { TrainingComponent } from "./training.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        TrainingRoutingModule,
        SharedModule
    ],
    declarations: [
        TrainingComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class TrainingModule { }
