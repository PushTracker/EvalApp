import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { DemosComponent } from './demos.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [{ path: '', component: DemosComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule],
  declarations: [DemosComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class DemosModule {}
