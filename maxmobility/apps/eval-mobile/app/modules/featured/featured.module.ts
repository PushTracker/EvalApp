// angular
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { FeaturedComponent } from './featured.component';

const routes: Routes = [{ path: '', component: FeaturedComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [FeaturedComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class FeaturedModule {}
