// angular
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { ProfileComponent } from './profile.component';

const routes: Routes = [{ path: '', component: ProfileComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [ProfileComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ProfileModule {}
