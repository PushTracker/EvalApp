// angular
import { Component } from '@angular/core';
// nativescript
import * as application from 'tns-core-modules/application';
import { registerElement } from 'nativescript-angular/element-registry';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { Video as ExoPlayer } from 'nativescript-exoplayer';
// const NS_EXOPLAYER = require('nativescript-exoplayer')
// these modules don't have index.d.ts so TS compiler doesn't know their shape for importing
const NS_CAROUSEL = require('nativescript-carousel');
// app
import { UserService, LoggingService, CLog } from '@maxmobility/mobile';
import { RouterExtensions } from 'nativescript-angular/router';

registerElement('Carousel', () => NS_CAROUSEL.Carousel);
registerElement('CarouselItem', () => NS_CAROUSEL.CarouselItem);
// registerElement('exoplayer', () => NS_EXOPLAYER.ExoVideoPlayer);
registerElement('exoplayer', () => ExoPlayer);

import * as Platform from "platform";
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'ns-app',
  template: '<page-router-outlet></page-router-outlet>'
})
export class AppComponent {
  constructor(
    private _logService: LoggingService,
    private _userService: UserService,
    private _router: RouterExtensions,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang("en");
    this.translate.use(Platform.device.language);
    // application level events
    // application.on(application.uncaughtErrorEvent, (args: application.UnhandledErrorEventData) => {
    //   console.log('uncaughtException', args.error);
    // });

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
