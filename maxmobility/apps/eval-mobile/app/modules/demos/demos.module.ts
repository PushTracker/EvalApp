import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { DemosComponent } from './demos.component';

const routes: Routes = [{ path: '', component: DemosComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [DemosComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class DemosModule {}
