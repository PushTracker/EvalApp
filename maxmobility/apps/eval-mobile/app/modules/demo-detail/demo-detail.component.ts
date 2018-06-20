import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { DemoDetailView } from './shared/demo-detail-view.model';
import { DemoDetailViewService } from './shared/demo-detail-view.service';

import { View } from 'ui/core/view';
import { Image } from 'ui/image';
import { Label } from 'ui/label';
import * as dialogs from 'ui/dialogs';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { isAndroid, isIOS } from 'platform';
import { Feedback, FeedbackType, FeedbackPosition } from 'nativescript-feedback';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

import { CLog, LoggingService, Demo, Packet, DailyInfo, PushTracker, SmartDrive } from '@maxmobility/core';
import { DemoService, BluetoothService, FirmwareService, ProgressService } from '@maxmobility/mobile';

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
    private _demoService: DemoService,
    private _bluetoothService: BluetoothService
  ) {}

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  ngOnInit() {
    const query = this._route.snapshot.queryParams;
    if (query.index) {
      this._demoService
        .load()
        .then(() => {
          this.demo = DemoService.Demos.getItem(query.index);
        })
        .catch(err => {
          console.log(`Couldn't load demos: ${err}`);
        });
    } else {
    }
  }

  onSave() {
    return this.demo
      .use()
      .then(() => {
        return this._demoService.create(this.demo);
      })
      .then(() => {
        //return this._demoService.load();
      })
      .catch(err => {
        console.log(`Couldn't create / load demos: ${err}`);
      });
  }

  onScan() {
    this.barcodeScanner
      .scan({
        formats: 'QR_CODE, EAN_13',
        cancelLabel: 'Cancel Scan', // iOS only
        cancelLabelBackgroundColor: '#333333', // iOS only
        message: 'Scan a PushTracker or SmartDrive', // Android only
        showFlipCameraButton: true,
        preferFrontCamera: false,
        showTorchButton: true,
        beepOnScan: true,
        torchOn: false,
        closeCallback: () => {
          console.log('Scanner closed');
        }, // invoked when the scanner was closed (success or abort)
        resultDisplayDuration: 500, // Android only
        openSettingsIfPermissionWasPreviouslyDenied: true
      })
      .then(result => {
        const deviceType = result.text.indexOf('B') > -1 ? 'PushTracker' : 'SmartDrive';
        const serialNumber = result.text;
        if (deviceType === 'PushTracker') {
          this.demo.pushtracker_serial_number = serialNumber;
        } else {
          this.demo.smartdrive_serial_number = serialNumber;
        }
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
    dialogs
      .confirm({
        title: 'Transfer ' + this.demo.smartdrive_serial_number,
        message: 'Would you like to transfer to ' + this.demo.location,
        okButtonText: 'Transfer',
        cancelButtonText: 'Cancel'
      })
      .then(result => {
        // result argument is boolean
        console.log('Dialog result: ' + result);
      });
  }
}
