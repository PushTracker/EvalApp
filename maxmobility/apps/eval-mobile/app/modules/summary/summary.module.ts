import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SummaryComponent } from './summary.component';

const routes: Routes = [{ path: '', component: SummaryComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [SummaryComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SummaryModule {}
