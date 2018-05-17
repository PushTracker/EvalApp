// nativescript
// angular
import { NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
// libs
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
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
  TranslateModule,
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
