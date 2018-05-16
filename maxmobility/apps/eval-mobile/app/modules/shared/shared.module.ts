// nativescript
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptCommonModule } from 'nativescript-angular/common';

// angular
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

// libs
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
import { TNSFrescoModule } from 'nativescript-fresco/angular';


// app
import { SHARED_COMPONENTS } from './components';
// import { SHARED_PIPES } from './pipes';
// import { SHARED_DIRECTIVES } from './directives';

const SHARED_MODULES = [
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  NativeScriptRouterModule,
  NativeScriptUIListViewModule,
  NativeScriptUISideDrawerModule,
  TNSFontIconModule
];

@NgModule({
  imports: [...SHARED_MODULES],
  declarations: [...SHARED_COMPONENTS],
  //   entryComponents: [...SHARED_ENTRY_COMPONENTS],
  exports: [...SHARED_MODULES, ...SHARED_COMPONENTS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SharedModule {}
