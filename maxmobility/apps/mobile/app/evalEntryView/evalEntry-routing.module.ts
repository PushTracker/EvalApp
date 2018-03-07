import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { EvalEntryComponent } from "./evalEntry.component";

const routes: Routes = [
    { path: "", component: EvalEntryComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class EvalEntryRoutingModule { }
