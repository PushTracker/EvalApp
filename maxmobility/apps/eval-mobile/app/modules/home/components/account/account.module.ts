import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { AccountComponent } from './account.component';

const routes: Routes = [{ path: '', component: AccountComponent }];

const MODULES = [
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  NativeScriptUIListViewModule,
  NativeScriptUISideDrawerModule
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), ...MODULES],
  declarations: [AccountComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AccountModule {}
