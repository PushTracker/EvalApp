import { NgModule, APP_INITIALIZER, Optional, SkipSelf } from '@angular/core';

// nativescript
import { device } from 'tns-core-modules/platform';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';

// libs
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { throwIfAlreadyLoaded } from '@maxmobility/helpers';
import { LoadingIndicator } from 'nativescript-loading-indicator';
import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
import * as TNSKinvey from 'kinvey-nativescript-sdk';

import { CoreModule } from '@maxmobility/core';
// import {
// 	AboutStateModule,
// 	EVENT_PROVIDERS,
// } from '@maxmobility/features';

// app
import { PROVIDERS } from './services';
import { TNSKinveyService } from './services/tns-kinvey.service';

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

@NgModule({
	imports: [
		NativeScriptModule,
		NativeScriptHttpClientModule,
		TNSFontIconModule.forRoot({
			ion: './assets/ionicons.min.css'
		}),
		CoreModule.forRoot([
			// {
			// 	provide: PlatformLanguageToken,
			// 	useFactory: platformLangFactory
			// },
			// {
			// 	provide: PlatformKinveyToken,
			// 	useFactory: kinveyFactory
			// },
			// {
			// 	provide: KinveyService,
			// 	useClass: TNSKinveyService
			// }
		]),
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader
				// useFactory: createTranslateLoader
			}
		})
	],
	providers: [...PROVIDERS]
})
export class EvalMobileCoreModule {
	constructor(
		@Optional()
		@SkipSelf()
		parentModule: EvalMobileCoreModule
	) {
		// throwIfAlreadyLoaded(parentModule, 'EvalMobileCoreModule');
	}
}
