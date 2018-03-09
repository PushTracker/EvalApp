// angular
import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
// nativescript
import { NativeScriptRouterModule } from 'nativescript-angular/router';
// app
import { AccountComponent } from './account.component';

const routes: Routes = [{ path: '', component: AccountComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class AccountRoutingModule {}
