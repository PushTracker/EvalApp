import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { TrainingComponent } from './training.component';

const routes: Routes = [{ path: '', component: TrainingComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [TrainingComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class TrainingModule {}
