import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { DemoDetailView } from './shared/demo-detail-view.model';
import { DemoDetailViewService } from './shared/demo-detail-view.service';

import { View } from 'ui/core/view';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import * as dialogs from 'ui/dialogs';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { isAndroid, isIOS } from 'platform';
import { BluetoothService } from '@maxmobility/mobile';
import { CLog, LoggingService } from '@maxmobility/core';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

import { Demo } from '@maxmobility/core';
import { DemoService } from '@maxmobility/mobile';

@Component({
  selector: 'Demo',
  moduleId: module.id,
  templateUrl: './demo-detail.component.html',
  styleUrls: ['./demo-detail.component.css']
})
export class DemoDetailComponent implements OnInit {
  public demo: Demo = new Demo();

  constructor(
    private _route: ActivatedRoute,
    private barcodeScanner: BarcodeScanner,
    private _demoService: DemoService
  ) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  ngOnInit() {
    this._demoService
      .load()
      .then((demos: Array<Demo>) => {
        const query = this._route.snapshot.queryParams;
        this.demo = demos[query.index];
      })
      .catch(err => {
        console.log(`Couldn't load demos: ${err}`);
      });
  }

  onScan() {
    this.barcodeScanner
      .scan({
        formats: 'QR_CODE, EAN_13',
        cancelLabel: 'EXIT. Also, try the volume buttons!', // iOS only, default 'Close'
        cancelLabelBackgroundColor: '#333333', // iOS only, default '#000000' (black)
        message: 'Use the volume buttons for extra light', // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
        showFlipCameraButton: true, // default false
        preferFrontCamera: false, // default false
        showTorchButton: true, // default false
        beepOnScan: true, // Play or Suppress beep on scan (default true)
        torchOn: false, // launch with the flashlight on (default false)
        closeCallback: () => {
          console.log('Scanner closed');
        }, // invoked when the scanner was closed (success or abort)
        resultDisplayDuration: 500, // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
        openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
      })
      .then(result => {
        // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
        const deviceType = result.text.indexOf('B') > -1 ? 'PushTracker' : 'SmartDrive';
        const msg = `
Device: ${deviceType}
S/N:    ${result.text}`;
        console.log(msg);
        setTimeout(() => {
          alert({
            title: 'Scan result',
            message: msg,
            okButtonText: 'OK'
          });
        }, 500);
      })
      .catch(errorMessage => {
        console.log('No scan. ' + errorMessage);
      });
  }

  onSdTap() {
    // take a image of SD
    console.log('sd image tapped');
  }

  onPtTap() {
    // take a image of PT
    console.log('pt image tapped');
  }
}
