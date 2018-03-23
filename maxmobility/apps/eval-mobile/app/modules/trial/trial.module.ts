import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { SharedModule } from '../shared/shared.module';
import { TrialComponent } from './trial.component';

const routes: Routes = [{ path: '', component: TrialComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule],
  declarations: [TrialComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class TrialModule {}
