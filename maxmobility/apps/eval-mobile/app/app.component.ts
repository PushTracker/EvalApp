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
import { UserService } from '@maxmobility/mobile';

registerElement('Carousel', () => NS_CAROUSEL.Carousel);
registerElement('CarouselItem', () => NS_CAROUSEL.CarouselItem);
// registerElement('exoplayer', () => NS_EXOPLAYER.ExoVideoPlayer);
registerElement('exoplayer', () => ExoPlayer);

@Component({
  selector: 'ns-app',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor() {
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
        console.log('kinvey ping successful');
      })
      .catch(err => {
        console.log('kinvey ping error', err);
      });
  }
}
