import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { SearchComponent } from './search.component';

const routes: Routes = [{ path: '', component: SearchComponent }];

const MODULES = [
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  NativeScriptUIListViewModule,
  NativeScriptUISideDrawerModule
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes), ...MODULES],
  declarations: [SearchComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SearchModule {}
