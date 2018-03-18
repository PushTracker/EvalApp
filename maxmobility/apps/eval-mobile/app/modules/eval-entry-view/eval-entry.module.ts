import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { EvalEntryComponent } from './eval-entry.component';

const routes: Routes = [{ path: '', component: EvalEntryComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [EvalEntryComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class EvalEntryModule {}
