import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
// import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { SHARED_COMPONENTS } from './components';
// import { SHARED_PIPES } from './pipes';
// import { SHARED_DIRECTIVES } from './directives';

const SHARED_MODULES = [
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  NativeScriptRouterModule,
  NativeScriptUIListViewModule
  // TNSFontIconModule.forRoot({
  //   'fa': './fonts/font-awesome.css',
  //   'ion': './assets/ionicons.css'
  // })
];

@NgModule({
  imports: [...SHARED_MODULES],
  declarations: [...SHARED_COMPONENTS],
  //   entryComponents: [...SHARED_ENTRY_COMPONENTS],
  exports: [...SHARED_MODULES, ...SHARED_COMPONENTS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SharedModule {}
