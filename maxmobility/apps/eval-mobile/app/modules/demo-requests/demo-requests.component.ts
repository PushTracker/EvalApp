import { Component, NgZone } from '@angular/core';
import { Demo, PushTracker } from '@maxmobility/core';
import {
  BluetoothService,
  DemoService,
  FirmwareService,
  LocationService,
  LoggingService,
  ProgressService
} from '@maxmobility/mobile';
import { TranslateService } from '@ngx-translate/core';
import { Kinvey } from 'kinvey-nativescript-sdk';
import { PageRoute, RouterExtensions } from 'nativescript-angular/router';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import * as camera from 'nativescript-camera';
import { Feedback } from 'nativescript-feedback';
import * as geolocation from 'nativescript-geolocation';
import * as app from 'tns-core-modules/application';
import {
  ImageCropper,
  Result as ImageCropperResult
} from 'nativescript-imagecropper';
import * as LS from 'nativescript-localstorage';
import { Mapbox } from 'nativescript-mapbox';
import { Toasty } from 'nativescript-toasty';
import { switchMap } from 'rxjs/operators';
import { SmartEvalKeys } from 'smart-eval-kinvey';
import { ImageAsset } from 'tns-core-modules/image-asset/image-asset';
import {
  fromBase64,
  ImageSource
} from 'tns-core-modules/image-source/image-source';
import { isIOS, isAndroid } from 'tns-core-modules/platform';
import { setTimeout } from 'tns-core-modules/timer';
import { View } from 'tns-core-modules/ui/core/view';
import { action, alert, confirm, prompt } from 'tns-core-modules/ui/dialogs';
import { Page } from 'tns-core-modules/ui/page';
import * as utils from 'tns-core-modules/utils/utils';

@Component({
  selector: 'DemoRequests',
  moduleId: module.id,
  templateUrl: './demo-requests.component.html',
  styleUrls: ['./demo-requests.component.css']
})
export class DemoRequestsComponent {
  mapboxToken = SmartEvalKeys.MAPBOX_TOKEN;
  private _datastore = Kinvey.DataStore.collection<any>('DemoRequests');

  constructor(
    private _page: Page,
    private _routerExtensions: RouterExtensions,
    private _pageRoute: PageRoute,
    private _zone: NgZone,
    private _barcodeScanner: BarcodeScanner,
    private _progressService: ProgressService,
    private _demoService: DemoService,
    private _bluetoothService: BluetoothService,
    private _firmwareService: FirmwareService,
    private _translateService: TranslateService,
    private _loggingService: LoggingService
  ) {
    this._page.className = 'blue-gradient-down';
  }
}
