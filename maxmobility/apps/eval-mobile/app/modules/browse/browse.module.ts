import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { BrowseComponent } from './browse.component';

const routes: Routes = [{ path: '', component: BrowseComponent }];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  declarations: [BrowseComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class BrowseModule {}
