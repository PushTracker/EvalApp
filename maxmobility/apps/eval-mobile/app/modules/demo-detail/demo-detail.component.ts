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
import { Demos } from '../demos/demos.component';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'Demo',
  moduleId: module.id,
  templateUrl: './demo-detail.component.html',
  styleUrls: ['./demo-detail.component.css']
})
export class DemoDetailComponent implements OnInit {
  demos = Demos;
  demo = Array();
  index: number;
  checked_out: boolean = 0;
  sd_serial_number: string = '';
  pt_serial_number: string = '';
  model: string = '';
  sd_firmware: string = '';
  sd_bt_firmware: string = '';
  pt_firmware: string = '';
  current_location: string = '';
  sd_image: string = '';
  pt_image: string = '';
  last_used: string = '';
  detected_location = 'Craig Hospital';
  // array of previous lications
  //  locations: ObservableArray<Location> = new ObservableArray();

  constructor(private _route: ActivatedRoute, private barcodeScanner: BarcodeScanner) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  ngOnInit() {
    const query = this._route.snapshot.queryParams;
    this.index = query.index;
    const demo = this.demos[this.index];

    this.sd_serial_number = demo.SerialNumber;
    this.pt_serial_number = demo.PTSerialNumber;
    this.model = demo.Model;
    this.sd_firmware = demo.SDFirmware;
    this.sd_bt_firmware = demo.SDBTFirmware;
    this.pt_firmware = demo.PTFirmware;
    this.current_location = demo.Location;
    this.sd_image = demo.SDImage;
    this.pt_image = demo.PTImage;
    this.last_used = demo.LastUsed;
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
    // take an image of SD
    console.log('sd image tapped');
  }

  onPtTap() {
    // take an image of PT
    console.log('pt image tapped');
  }

  onSDRowTapped() {
    // this.checked_out ? "Deliver" : "Pick Up";

    dialogs
      .confirm({
        title: 'Transfer ' + this.sd_serial_number,
        message: 'Would you like to transfer to ' + this.detected_location,
        okButtonText: 'Transfer',
        cancelButtonText: 'Cancel'
      })
      .then(result => {
        // result argument is boolean
        console.log('Dialog result: ' + result);
      });
  }
}
