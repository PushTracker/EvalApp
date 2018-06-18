import { Component } from '@angular/core';
import { CLog, LoggingService, UserService } from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { registerElement } from 'nativescript-angular/element-registry';
import { RouterExtensions } from 'nativescript-angular/router';
import { Video as ExoPlayer } from 'nativescript-exoplayer';
import { device } from 'tns-core-modules/platform';

import { Push } from 'kinvey-nativescript-sdk/push';
import * as pushPlugin from 'nativescript-push-notifications';

// Register Custom Elements for Angular
const NS_CAROUSEL = require('nativescript-carousel');
registerElement('Carousel', () => NS_CAROUSEL.Carousel);
registerElement('CarouselItem', () => NS_CAROUSEL.CarouselItem);
registerElement('exoplayer', () => ExoPlayer);
registerElement('BarcodeScanner', () => require('nativescript-barcodescanner').BarcodeScannerView);
registerElement('Gradient', () => require('nativescript-gradient').Gradient);

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
    // Brad - sets the default language for ngx-translate
    // *** The value being set must match a translation .json file in assets/i18n/ or it will fail ***
    // wrapping this in try/catch due to https://github.com/PushTracker/EvalApp/issues/43
    try {
      this._translateService.setDefaultLang('en');
      // this._translateService.use(device.language);
      console.log(`device language: ${device.language}`);
    } catch (error) {
      CLog('Error trying to set the TranslateService.use() default to device.language.');
      console.log(JSON.stringify(error));
    }

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
        if (this._userService.user) {
          const usePUSH = false;
          if (usePUSH) {
            const promise = Push.register({
              android: {
                senderID: '1053576736707'
              },
              ios: {
                alert: true,
                badge: true,
                sound: true
              }
            })
              .then((deviceToken: string) => {
                console.log(`registered push notifications: ${deviceToken}`);
                Push.onNotification((data: any) => {
                  alert(`Message received!\n${JSON.stringify(data)}`);
                });
              })
              .catch((error: Error) => {
                console.log(`Couldn't register push notifications: ${error}`);
              });
          } else {
            pushPlugin.register(
              {
                // android specific
                senderID: '1053576736707',
                notificationCallbackAndroid: (stringifiedData: string, fcmNotification: any) => {
                  console.log('GOT NOTIFICATION');
                  console.log(`Got notification: ${stringifiedData}`);
                },
                // ios specific
                alert: true,
                badge: true,
                sound: true,
                interactiveSettings: {
                  actions: [
                    {
                      identifier: 'READ_IDENTIFIER',
                      title: 'Read',
                      activationMode: 'foreground',
                      destructive: false,
                      authenticationRequired: true
                    },
                    {
                      identifier: 'CANCEL_IDENTIFIER',
                      title: 'Cancel',
                      activationMode: 'foreground',
                      destructive: true,
                      authenticationRequired: true
                    }
                  ],
                  categories: [
                    {
                      identifier: 'READ_CATEGORY',
                      actionsForDefaultContext: ['READ_IDENTIFIER', 'CANCEL_IDENTIFIER'],
                      actionsForMinimalContext: ['READ_IDENTIFIER', 'CANCEL_IDENTIFIER']
                    }
                  ]
                },
                notificationCallbackIOS: (message: any) => {
                  alert('Message received!\n' + JSON.stringify(message));
                }
              },
              token => {
                console.log(`registered push notifications: ${token}`);
              },
              error => {
                console.log(`Couldn't register push notifications: ${error}`);
              }
            );
          }
        }
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
