import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SharedModule } from "../shared/shared.module";
import { FAQRoutingModule } from "./faq-routing.module";
import { FAQComponent } from "./faq.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        FAQRoutingModule,
        SharedModule
    ],
    declarations: [
        FAQComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class FAQModule { }
