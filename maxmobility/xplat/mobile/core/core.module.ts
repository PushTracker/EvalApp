import { NgModule, NO_ERRORS_SCHEMA, APP_INITIALIZER, Optional, SkipSelf } from '@angular/core';

// nativescript
import { device } from 'tns-core-modules/platform';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';

// libs
import * as TNSKinvey from 'kinvey-nativescript-sdk';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { throwIfAlreadyLoaded } from '@maxmobility/helpers';
import { LoadingIndicator } from 'nativescript-loading-indicator';
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
import { MaxMobilityCoreModule } from '@maxmobility/core';
// app
import { PROVIDERS } from './services';

// factories
export function loadingIndicatorFactory() {
  return new LoadingIndicator();
}

export function platformLangFactory() {
  console.log('platformLangFactory:', device.language);
  return device.language;
}

export function kinveyFactory() {
  return TNSKinvey;
}

const MODULES = [
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  NativeScriptRouterModule,
  NativeScriptUISideDrawerModule,
  NativeScriptUIListViewModule,
  TranslateModule,
  TNSFontIconModule
];

@NgModule({
  imports: [...MODULES],
  declarations: [],
  exports: [...MODULES],
  providers: [...PROVIDERS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class MobileCoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: MobileCoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, 'MobileCoreModule');
  }
}
