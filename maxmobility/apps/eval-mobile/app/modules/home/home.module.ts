import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), SharedModule],
  declarations: [HomeComponent],
  exports: [],
  schemas: [NO_ERRORS_SCHEMA]
})
export class HomeModule {}
