import { Component } from '@angular/core';
import { CLog, LoggingService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { registerElement } from 'nativescript-angular/element-registry';
import { RouterExtensions } from 'nativescript-angular/router';
import { Video as ExoPlayer } from 'nativescript-exoplayer';
import { Gif } from 'nativescript-gif';
import * as orientation from 'nativescript-orientation';
import * as application from 'tns-core-modules/application';
import { device } from 'tns-core-modules/platform';

// Register Custom Elements for Angular
const NS_CAROUSEL = require('nativescript-carousel');
registerElement('Carousel', () => NS_CAROUSEL.Carousel);
registerElement('CarouselItem', () => NS_CAROUSEL.CarouselItem);
registerElement('exoplayer', () => ExoPlayer);
registerElement('BarcodeScanner', () => require('nativescript-barcodescanner').BarcodeScannerView);
registerElement('Gradient', () => require('nativescript-gradient').Gradient);
registerElement('Gif', () => Gif);

@Component({
  selector: 'ns-app',
  template: '<page-router-outlet></page-router-outlet>'
})
export class AppComponent {
  constructor(
    private _translateService: TranslateService,
    private _logService: LoggingService,
    private _userService: UserService,
    private _router: RouterExtensions
  ) {
    // set the orientation to be portrait and don't allow orientation changes
    orientation.setOrientation('portrait');
    orientation.disableRotation(); // may not need to call this - docs say 'set' calls this

    // Brad - sets the default language for ngx-translate
    // *** The value being set must match a translation .json file in assets/i18n/ or it will fail ***
    // wrapping this in try/catch due to https://github.com/PushTracker/EvalApp/issues/43
    try {
      this._translateService.setDefaultLang('en');
      this._translateService.addLangs(['en', 'es', 'de', 'fr', 'nl']);
      // this._translateService.use(device.language);
      console.log(`device language: ${device.language}`);
    } catch (error) {
      CLog('Error trying to set the TranslateService.use() default to device.language.');
      console.log(JSON.stringify(error));
    }

    // application level events
    application.on(application.uncaughtErrorEvent, (args: application.UnhandledErrorEventData) => {
      console.log('**** App Uncaught Error Event ****', args.error);
    });

    application.on(application.resumeEvent, (args: application.ApplicationEventData) => {
      console.log('**** App Resume Event ****');
      // set the orientation to be portrait and don't allow orientation changes
      orientation.setOrientation('portrait');
      orientation.disableRotation(); // may not need to call this - docs say 'set' calls this
    });

    Kinvey.init({
      appKey: `${UserService.Kinvey_App_Key}`,
      appSecret: `${UserService.Kinvey_App_Secret}`
    });
    Kinvey.ping()
      .then(res => {
        CLog(`Kinvey ping successful, SDK is active ${String.fromCodePoint(0x1f60e)}`);
      })
      .catch(err => {
        this._logService.logException(err);
      });

    // if user is logged in, go home, else go to login
    if (this._userService.user) {
      this._router.navigate(['/home']);
    } else {
      this._router.navigate(['/login']);
    }
  }
}
