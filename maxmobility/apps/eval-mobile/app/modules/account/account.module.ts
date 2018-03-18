// angular
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
// nativescript
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
// app
import { SharedModule } from '../../shared/shared.module';
// import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';

const routes: Routes = [{ path: '', component: AccountComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), NativeScriptCommonModule, NativeScriptFormsModule, SharedModule],
  declarations: [AccountComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AccountModule {}
