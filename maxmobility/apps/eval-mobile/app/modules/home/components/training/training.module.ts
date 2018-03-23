import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { TrainingComponent } from './training.component';

const routes: Routes = [{ path: '', component: TrainingComponent }];

const MODULES = [NativeScriptCommonModule, NativeScriptUIListViewModule, NativeScriptUISideDrawerModule];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), ...MODULES],
  declarations: [TrainingComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class TrainingModule {}
