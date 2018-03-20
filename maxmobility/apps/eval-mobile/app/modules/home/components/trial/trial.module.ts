import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { TrialComponent } from './trial.component';

const routes: Routes = [{ path: '', component: TrialComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [TrialComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class TrialModule {}
