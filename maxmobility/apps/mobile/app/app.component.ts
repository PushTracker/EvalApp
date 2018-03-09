// angular
import { Component } from '@angular/core';
// nativescript
import { registerElement } from 'nativescript-angular/element-registry';
import { Kinvey } from 'kinvey-nativescript-sdk';
// these modules don't have index.d.ts so TS compiler doesn't know their shape for importing
const NS_CAROUSEL = require('nativescript-carousel');
const NS_EXOPLAYER = require('nativescript-exoplayer');
// app
import { TNSKinveyService } from '@maxmobility/mobile';

registerElement('Carousel', () => NS_CAROUSEL.Carousel);
registerElement('CarouselItem', () => NS_CAROUSEL.CarouselItem);
registerElement('exoplayer', () => NS_EXOPLAYER.ExoVideoPlayer);

@Component({
  selector: 'ns-app',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor() {
    Kinvey.init({
      appKey: `${TNSKinveyService.Kinvey_App_Key}`,
      appSecret: `${TNSKinveyService.Kinvey_App_Secret}`
    });
  }
}
