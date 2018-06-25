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

  private index: number = -1;

  constructor(
    private _route: ActivatedRoute,
    private barcodeScanner: BarcodeScanner,
    private _progressService: ProgressService,
    private _demoService: DemoService,
    private _bluetoothService: BluetoothService
  ) {
    const query = this._route.snapshot.queryParams;
    if (query.index) {
      this.index = query.index;
      this.demo = DemoService.Demos.getItem(this.index);
    } else {
    }
  }

  isIOS(): boolean {
    return isIOS;
  }

  isAndroid(): boolean {
    return isAndroid;
  }

  ngOnInit() {}

  onSave() {
    this._progressService.show('Saving');
    return this.demo
      .use()
      .then(() => {
        return this._demoService.create(this.demo);
      })
      .then(() => {
        // the demo service calls load() at the end ofa create
        // now re-load our data from the service
        if (this.index > -1) {
        } else {
          this.index = DemoService.Demos.indexOf(
            this._demoService.getDemoBySmartDriveSerialNumber(this.demo.smartdrive_serial_number)
          );
        }
        this.demo = DemoService.Demos.getItem(this.index);
        this._progressService.hide();
      })
      .catch(err => {
        this._progressService.hide();
        console.log(`Couldn't create / load demos: ${err}`);
      });
  }

  onScan(deviceName) {
    this.barcodeScanner
      .scan({
        formats: 'QR_CODE, EAN_13',
        cancelLabel: 'Cancel Scan', // iOS only
        cancelLabelBackgroundColor: '#333333', // iOS only
        message: 'Scan a ' + (deviceName || 'SmartDrive or PushTracker'), // Android only
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
        const deviceType = result.text.indexOf('B') > -1 ? 'pushtracker' : 'smartdrive';
        if (deviceName && deviceType !== deviceName) {
          throw 'Wrong device scanned!';
        } else {
          const serialNumber = result.text;
          if (deviceType === 'pushtracker') {
            this.demo.pushtracker_serial_number = serialNumber;
          } else {
            this.demo.smartdrive_serial_number = serialNumber;
          }
        }
        this.demo.model = 'MX2+';
      })
      .catch(errorMessage => {
        console.log('No scan. ' + errorMessage);
      });
  }

  onEditSD() {
    dialogs
      .prompt({
        title: 'Enter SmartDrive S/N',
        message: 'Please enter SmartDrive Serial Number',
        okButtonText: 'Save',
        cancelButtonText: 'Cancel'
      })
      .then(r => {
        r.text = r.text.trim();
        if (r.result && r.text && r.text.length) {
          this.demo.smartdrive_serial_number = r.text;
        }
      });
  }

  onEditPT() {
    dialogs
      .prompt({
        title: 'Enter PushTracker S/N',
        message: 'Please enter PushTracker Serial Number',
        okButtonText: 'Save',
        cancelButtonText: 'Cancel'
      })
      .then(r => {
        r.text = r.text.trim();
        if (r.result && r.text && r.text.length) {
          if (r.text[0] === 'B' || r.text[0] === 'b') {
            this.demo.pushtracker_serial_number = r.text.toUpperCase();
          } else {
            dialogs.alert(`${r.text} is not a valid PushTracker serial number!`);
          }
        }
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
